import { NextResponse } from "next/server";
import { addDoc, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { parseISO, format } from "date-fns";
import { serverDb } from "@/lib/firebaseServer";
import { buildBookingDocument, type BookingSlot, type CreateBookingPayload } from "@/lib/booking";
import { normalizeBookingRecord, normalizeDate } from "@/lib/bookingNormalization";
import { isValidEmail, normalizeEmail, normalizePhone } from "@/lib/contactNormalization";
import { isArchivedVenue } from "@/lib/venue";
import { ACTIVE_BOOKING_STATUSES, getExistingSlotsForDay, hasCollision, type ExistingBookingShape } from "@/lib/bookingAvailability";
import { sendBookingNotification } from "@/lib/bookingNotifications";

const validSlotSet: Set<BookingSlot> = new Set(["full", "morning", "evening"]);
const parsedCooldownSeconds = Number.parseInt(process.env.BOOKING_COOLDOWN_SECONDS ?? "", 10);
const BOOKING_COOLDOWN_MS =
  Number.isFinite(parsedCooldownSeconds) && parsedCooldownSeconds > 0 ? parsedCooldownSeconds * 1000 : 60 * 1000;

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function tooManyRequests(message: string, code: "BOOKING_RATE_LIMIT" | "BOT_DETECTED") {
  return NextResponse.json({ ok: false, error: message, code }, { status: 429 });
}

function hasHoneypotValue(payload: CreateBookingPayload) {
  return typeof payload.website === "string" && payload.website.trim().length > 0;
}

type VenueShape = {
  name?: unknown;
  price?: unknown;
  capacity?: unknown;
};

function createReferenceId() {
  return `#ES-${format(new Date(), "yyyyMMdd")}-${Math.floor(100 + Math.random() * 900)}`;
}

export async function POST(request: Request) {
  let payload: CreateBookingPayload;

  try {
    payload = (await request.json()) as CreateBookingPayload;
  } catch {
    return badRequest("Invalid JSON payload.");
  }

  const customerInput = payload.customer ?? {
    name: payload.customerName ?? "",
    email: payload.customerEmail ?? "",
    phone: payload.customerPhone ?? "",
  };
  const reservationInput = payload.reservation ?? {
    startDate: payload.date ?? "",
    endDate: payload.endDate ?? null,
    dayCount: payload.days ?? 1,
    timeSlot: payload.timeSlot ?? "full",
    dailySchedule: payload.dailySchedule ?? {},
  };

  const requiredStrings: Array<[string, string | undefined | null]> = [
    ["venueId", payload.venueId],
    ["startDate", reservationInput.startDate],
    ["customerName", customerInput.name],
    ["customerEmail", customerInput.email],
    ["customerPhone", customerInput.phone],
  ];

  const missing = requiredStrings.find(([, value]) => typeof value !== "string" || !value.trim());
  if (missing) return badRequest(`Missing or invalid "${missing[0]}".`);

  const venueId = payload.venueId.trim();

  if (!isValidEmail(normalizeEmail(customerInput.email))) {
    return badRequest("Invalid customerEmail.");
  }

  if (!normalizePhone(customerInput.phone)) {
    return badRequest("Invalid customerPhone.");
  }

  if (!Number.isFinite(payload.guests) || payload.guests < 1) {
    return badRequest("Invalid guests value.");
  }

  if (hasHoneypotValue(payload)) {
    return tooManyRequests("Unable to complete booking request.", "BOT_DETECTED");
  }

  if (!reservationInput.dailySchedule || typeof reservationInput.dailySchedule !== "object") {
    return badRequest("Invalid dailySchedule.");
  }

  const scheduleEntries = Object.entries(reservationInput.dailySchedule);
  if (scheduleEntries.length === 0) {
    return badRequest("dailySchedule must include at least one day.");
  }

  const startDate = parseISO(reservationInput.startDate);
  if (Number.isNaN(startDate.getTime())) {
    return badRequest("Invalid date.");
  }

  if (reservationInput.endDate !== null && reservationInput.endDate !== undefined) {
    const endDateValue = parseISO(reservationInput.endDate);
    if (Number.isNaN(endDateValue.getTime())) {
      return badRequest("Invalid endDate.");
    }
    if (endDateValue < startDate) {
      return badRequest("endDate must be on or after startDate.");
    }
  }

  let normalizedSchedule: Record<string, BookingSlot> = {};

  for (const [dayKey, slot] of scheduleEntries) {
    const day = parseISO(dayKey);
    if (Number.isNaN(day.getTime())) {
      return badRequest(`Invalid schedule day key: "${dayKey}".`);
    }
    if (!validSlotSet.has(slot)) {
      return badRequest(`Invalid slot "${slot}" for day "${dayKey}".`);
    }
    normalizedSchedule = { ...normalizedSchedule, [format(day, "yyyy-MM-dd")]: slot };
  }

  try {
    const venueSnapshot = await getDoc(doc(serverDb, "venues", venueId));
    if (!venueSnapshot.exists() || isArchivedVenue(venueSnapshot.data() as { isArchived?: boolean })) {
      return NextResponse.json({ ok: false, error: "Venue not found." }, { status: 404 });
    }

    const venueData = venueSnapshot.data() as VenueShape;
    const venuePrice = typeof venueData.price === "number" && Number.isFinite(venueData.price) ? venueData.price : null;
    const venueName = typeof venueData.name === "string" ? venueData.name.trim() : "";
    const venueCapacity = typeof venueData.capacity === "number" && Number.isFinite(venueData.capacity) ? venueData.capacity : null;

    if (!venuePrice || venuePrice <= 0) {
      return NextResponse.json({ ok: false, error: "Venue pricing is unavailable." }, { status: 500 });
    }

    if (!venueName) {
      return NextResponse.json({ ok: false, error: "Venue data is incomplete." }, { status: 500 });
    }

    if (venueCapacity !== null && payload.guests > venueCapacity) {
      return badRequest("Guest count exceeds venue capacity.");
    }

    const cooldownWindowStart = new Date(Date.now() - BOOKING_COOLDOWN_MS);
    const recentBookingsQuery = query(
      collection(serverDb, "bookings"),
      where("customer.normalizedEmail", "==", normalizeEmail(customerInput.email)),
      where("customer.normalizedPhone", "==", normalizePhone(customerInput.phone))
    );
    const recentBookingsSnapshot = await getDocs(recentBookingsQuery);
    const isRecentlyBooked = recentBookingsSnapshot.docs.some((snapshot) => {
      const booking = normalizeBookingRecord({ id: snapshot.id, ...snapshot.data() });
      const createdAt = normalizeDate(booking.createdAt) ?? normalizeDate(booking.updatedAt);
      return Boolean(createdAt && createdAt.getTime() >= cooldownWindowStart.getTime());
    });

    if (isRecentlyBooked) {
      return tooManyRequests("Please wait a few minutes before submitting another booking.", "BOOKING_RATE_LIMIT");
    }

    const existingQuery = query(
      collection(serverDb, "bookings"),
      where("venueId", "==", venueId),
      where("status", "in", [...ACTIVE_BOOKING_STATUSES])
    );
    const existingSnapshot = await getDocs(existingQuery);

    for (const [dayKey, requestedSlot] of Object.entries(normalizedSchedule)) {
      const requestDay = parseISO(dayKey);
      const existingSlots = existingSnapshot.docs
        .flatMap((doc) => getExistingSlotsForDay(doc.data() as ExistingBookingShape, requestDay));

      if (hasCollision(existingSlots, requestedSlot)) {
        return NextResponse.json(
          {
            ok: false,
            code: "SLOT_CONFLICT",
            error: `Conflict on ${format(requestDay, "PPP")}: This slot is already reserved.`,
          },
          { status: 409 }
        );
      }
    }

    const normalizedDays = Object.keys(normalizedSchedule).sort();
    const finalTimeSlot: BookingSlot | "custom" =
      normalizedDays.length > 1 ? "custom" : normalizedSchedule[normalizedDays[0]] ?? "full";
    const referenceId = createReferenceId();
    const bookingDocument = buildBookingDocument(
      {
        ...payload,
        customer: customerInput,
        reservation: {
          startDate: reservationInput.startDate,
          endDate: reservationInput.endDate,
          dayCount: normalizedDays.length,
          timeSlot: finalTimeSlot,
          dailySchedule: normalizedSchedule,
        },
        pricing: {
          ...(payload.pricing ?? {}),
          currency: payload.pricing?.currency ?? payload.currency ?? "MYR",
        },
        customerEmail: customerInput.email,
        customerPhone: customerInput.phone,
        customerName: customerInput.name,
        date: reservationInput.startDate,
        endDate: reservationInput.endDate,
        days: normalizedDays.length,
        dailySchedule: normalizedSchedule,
        timeSlot: finalTimeSlot,
        status: "pending",
      },
      {
        venueId,
        venueName,
        venuePrice,
        referenceId,
        status: "pending",
        createdAt: new Date(),
      }
    );

    const docRef = await addDoc(collection(serverDb, "bookings"), bookingDocument);
    const createdBooking = normalizeBookingRecord({ id: docRef.id, ...bookingDocument });
    const notification = await sendBookingNotification({
      event: "created",
      booking: createdBooking,
    });

    if (notification.status === "failed") {
      console.error("Booking notification failed:", notification.reason);
    }

    return NextResponse.json(
      {
        ok: true,
        bookingId: docRef.id,
        referenceId,
        notificationStatus: notification.status,
        notificationReason: notification.reason,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create booking at the moment. Please try again." },
      { status: 500 }
    );
  }
}
