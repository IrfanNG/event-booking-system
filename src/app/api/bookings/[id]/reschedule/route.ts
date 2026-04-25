import { NextResponse } from "next/server";
import { format, parseISO } from "date-fns";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  buildBookingDocument,
  type BookingSlot,
  type CreateBookingPayload,
} from "@/lib/booking";
import { calculateCancellationQuote, canRescheduleBooking } from "@/lib/bookingCancellation";
import { getBookingStatus, normalizeBookingRecord } from "@/lib/bookingNormalization";
import { ACTIVE_BOOKING_STATUSES, getExistingSlotsForDay, hasCollision, type ExistingBookingShape } from "@/lib/bookingAvailability";
import { isValidEmail, normalizeEmail, normalizePhone } from "@/lib/contactNormalization";
import { isArchivedVenue } from "@/lib/venue";
import { sendBookingNotification } from "@/lib/bookingNotifications";

const validSlotSet: Set<BookingSlot> = new Set(["full", "morning", "evening"]);

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function createReferenceId() {
  return `#ES-${format(new Date(), "yyyyMMdd")}-${Math.floor(100 + Math.random() * 900)}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const normalizedEmail = normalizeEmail(customerInput.email);
  const normalizedPhone = normalizePhone(customerInput.phone);

  if (!isValidEmail(normalizedEmail)) {
    return badRequest("Invalid customerEmail.");
  }

  if (!normalizedPhone) {
    return badRequest("Invalid customerPhone.");
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

  let normalizedSchedule: Record<string, BookingSlot> = {};
  for (const [dayKey, slot] of scheduleEntries) {
    const day = parseISO(dayKey);
    if (Number.isNaN(day.getTime())) {
      return badRequest(`Invalid schedule day key: "${dayKey}".`);
    }
    if (!validSlotSet.has(slot as BookingSlot)) {
      return badRequest(`Invalid slot "${slot}" for day "${dayKey}".`);
    }
    normalizedSchedule[format(day, "yyyy-MM-dd")] = slot as BookingSlot;
  }

  try {
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: "Database not initialized." }, { status: 500 });
    }

    const bookingRef = adminDb.collection("bookings").doc(id);
    const bookingSnapshot = await bookingRef.get();
    if (!bookingSnapshot.exists) {
      return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
    }

    const booking = normalizeBookingRecord({ id: bookingSnapshot.id, ...bookingSnapshot.data() });

    if (getBookingStatus(booking) === "cancelled") {
      return NextResponse.json({ ok: false, error: "Booking is already cancelled." }, { status: 409 });
    }

    if (getBookingStatus(booking) === "rejected") {
      return NextResponse.json({ ok: false, error: "Rejected bookings cannot be rescheduled." }, { status: 409 });
    }

    if (booking.customer.normalizedEmail !== normalizedEmail || booking.customer.normalizedPhone !== normalizedPhone) {
      return NextResponse.json({ ok: false, error: "This booking does not belong to the provided contact details." }, { status: 403 });
    }

    if (!canRescheduleBooking(booking)) {
      return NextResponse.json({ ok: false, error: "Reschedules require at least 7 days notice." }, { status: 400 });
    }

    if (!payload.venueId || booking.venueId !== venueId) {
      return NextResponse.json({ ok: false, error: "The replacement booking must use the same venue." }, { status: 400 });
    }

    const venueDoc = await adminDb.collection("venues").doc(venueId).get();
    if (!venueDoc.exists || isArchivedVenue(venueDoc.data() as { isArchived?: boolean })) {
      return NextResponse.json({ ok: false, error: "Venue not found." }, { status: 404 });
    }

    const venueData = venueDoc.data() as { name?: unknown; price?: unknown; capacity?: unknown };
    const venuePrice = typeof venueData.price === "number" && Number.isFinite(venueData.price) ? venueData.price : null;
    const venueName = typeof venueData.name === "string" ? venueData.name.trim() : "";
    const venueCapacity = typeof venueData.capacity === "number" && Number.isFinite(venueData.capacity) ? venueData.capacity : null;

    if (!venuePrice || venuePrice <= 0 || !venueName) {
      return NextResponse.json({ ok: false, error: "Venue pricing or data is unavailable." }, { status: 500 });
    }

    const guests = Number.isFinite(payload.guests) && payload.guests > 0 ? payload.guests : booking.guests;
    if (venueCapacity !== null && guests > venueCapacity) {
      return badRequest(`Guest count exceeds capacity (${venueCapacity}).`);
    }

    const existingSnapshot = await adminDb.collection("bookings")
      .where("venueId", "==", venueId)
      .where("status", "in", [...ACTIVE_BOOKING_STATUSES])
      .get();

    for (const [dayKey, requestedSlot] of Object.entries(normalizedSchedule)) {
      const requestDay = parseISO(dayKey);
      const existingSlots = existingSnapshot.docs
        .filter((snapshot) => snapshot.id !== id)
        .flatMap((snapshot) => getExistingSlotsForDay(snapshot.data() as ExistingBookingShape, requestDay));

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
      normalizedDays.length > 1 ? "custom" : (normalizedSchedule[normalizedDays[0]] as BookingSlot) || "full";
    const referenceId = createReferenceId();
    const quote = calculateCancellationQuote(booking);
    if (!quote) {
      return NextResponse.json({ ok: false, error: "Unable to calculate cancellation refund." }, { status: 500 });
    }

    const newBookingDocument = buildBookingDocument(
      {
        ...payload,
        venueId,
        venueName,
        guests,
        customer: {
          name: booking.customer.name,
          email: booking.customer.email,
          phone: booking.customer.phone,
        },
        reservation: {
          startDate: reservationInput.startDate,
          endDate: reservationInput.endDate,
          dayCount: normalizedDays.length,
          timeSlot: finalTimeSlot,
          dailySchedule: normalizedSchedule,
        },
        pricing: {
          currency: payload.pricing?.currency ?? payload.currency ?? "MYR",
        },
        customerName: booking.customer.name,
        customerEmail: booking.customer.email,
        customerPhone: booking.customer.phone,
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
    newBookingDocument.lifecycle = {
      ...newBookingDocument.lifecycle,
      rescheduledFromBookingId: id,
    };

    const newBookingRef = await adminDb.collection("bookings").add({
      ...newBookingDocument,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const replacementBooking = normalizeBookingRecord({ id: newBookingRef.id, ...newBookingDocument });

    try {
      const now = new Date();
      await bookingRef.update({
        status: "cancelled",
        updatedAt: now,
        cancelledAt: now,
        statusUpdatedAt: now,
        totalPrice: quote.retainedAmount,
        pricing: stripUndefined({
          ...booking.pricing,
          refundAmount: quote.refundAmount,
          totalAmount: quote.retainedAmount,
        }),
        lifecycle: stripUndefined({
          ...booking.lifecycle,
          status: "cancelled",
          updatedAt: now,
          cancelledAt: now,
          statusUpdatedAt: now,
          cancelledBy: "customer",
          cancelReason: "Rescheduled by customer",
          replacementBookingId: newBookingRef.id,
        }),
      });
    } catch (error) {
      await newBookingRef.delete();
      throw error;
    }

    sendBookingNotification({
      event: "rescheduled",
      booking: replacementBooking,
      previousBooking: booking,
      reason: "Rescheduled by customer",
    }).catch(err => console.error("[Reschedule] Notification failed:", err));

    return NextResponse.json(
      {
        ok: true,
        bookingId: id,
        replacementBookingId: newBookingRef.id,
        referenceId,
        refundAmount: quote.refundAmount,
        notificationStatus: "sent",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/bookings/[id]/reschedule error:", error.message);
    return NextResponse.json(
      { ok: false, error: `Unable to reschedule: ${error.message}` },
      { status: 500 }
    );
  }
}
