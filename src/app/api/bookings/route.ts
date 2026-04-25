import { NextResponse } from "next/server";
import { parseISO, format } from "date-fns";
import { adminDb } from "@/lib/firebaseAdmin";
import { buildBookingDocument, type BookingSlot, type CreateBookingPayload } from "@/lib/booking";
import { normalizeBookingRecord, normalizeDate } from "@/lib/bookingNormalization";
import { normalizeEmail, normalizePhone } from "@/lib/contactNormalization";
import { isArchivedVenue } from "@/lib/venue";
import { ACTIVE_BOOKING_STATUSES, getExistingSlotsForDay, hasCollision, type ExistingBookingShape } from "@/lib/bookingAvailability";
import { sendBookingNotification } from "@/lib/bookingNotifications";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function tooManyRequests(message: string, code: "BOOKING_RATE_LIMIT" | "BOT_DETECTED") {
  return NextResponse.json({ ok: false, error: message, code }, { status: 429 });
}

function serverError(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}

const parsedCooldownSeconds = Number.parseInt(process.env.BOOKING_COOLDOWN_SECONDS ?? "", 10);
const BOOKING_COOLDOWN_MS =
  Number.isFinite(parsedCooldownSeconds) && parsedCooldownSeconds > 0 ? parsedCooldownSeconds * 1000 : 60 * 1000;

type VenueShape = {
  name?: unknown;
  price?: unknown;
  capacity?: unknown;
  isArchived?: boolean;
};

function createReferenceId() {
  return `#ES-${format(new Date(), "yyyyMMdd")}-${Math.floor(100 + Math.random() * 900)}`;
}

export async function GET(request: Request) {
  try {
    if (!adminDb) {
      console.error("[GET /api/bookings] adminDb is not initialized.");
      return serverError("Database connection not initialized.");
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");

    if (!venueId) {
      return badRequest("venueId is required.");
    }

    const snapshot = await adminDb.collection("bookings")
      .where("venueId", "==", venueId)
      .where("status", "in", [...ACTIVE_BOOKING_STATUSES])
      .get();
    
    const bookings = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        venueId: data.venueId,
        date: data.date,
        endDate: data.endDate,
        timeSlot: data.timeSlot,
        status: data.status,
        dailySchedule: data.dailySchedule,
        createdAt: data.createdAt,
      };
    }).sort((a, b) => {
      // Server-side sort: Latest created first
      const timeA = normalizeDate(a.createdAt)?.getTime() ?? 0;
      const timeB = normalizeDate(b.createdAt)?.getTime() ?? 0;
      if (timeB !== timeA) return timeB - timeA;

      // Fallback: Latest event date first
      const dateA = normalizeDate(a.date)?.getTime() ?? 0;
      const dateB = normalizeDate(b.date)?.getTime() ?? 0;
      return dateB - dateA;
    });

    return NextResponse.json({ ok: true, bookings });
  } catch (error: any) {
    console.error("[GET /api/bookings] Error:", error.message);
    return serverError("Unable to fetch availability.");
  }
}

export async function POST(request: Request) {
  try {
    if (!adminDb) {
      console.error("[POST /api/bookings] adminDb is not initialized.");
      return serverError("Database connection not initialized.");
    }

    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return badRequest("Invalid JSON payload.");
    }

    console.log("[POST /api/bookings] Manual Validation Start...");
    
    // MANUAL VALIDATION (Bypassing Zod to fix internal TypeError)
    const venueId = String(body.venueId || "").trim();
    const guests = Number(body.guests || 0);
    const website = body.website || "";

    if (!venueId) return badRequest("venueId is required.");
    if (guests < 1) return badRequest("guests must be at least 1.");
    if (website) return tooManyRequests("Bot detected.", "BOT_DETECTED");

    const customerInput = body.customer ?? {
      name: body.customerName ?? "",
      email: body.customerEmail ?? "",
      phone: body.customerPhone ?? "",
    };

    if (!customerInput.name || !customerInput.email || !customerInput.phone) {
      return badRequest("Customer details (name, email, phone) are required.");
    }

    const reservationInput = body.reservation ?? {
      startDate: body.date ?? "",
      endDate: body.endDate ?? null,
      dayCount: body.days ?? 1,
      timeSlot: body.timeSlot ?? "full",
      dailySchedule: body.dailySchedule ?? {},
    };

    if (!reservationInput.startDate) return badRequest("startDate is required.");

    const startDate = parseISO(reservationInput.startDate);
    if (Number.isNaN(startDate.getTime())) {
      return badRequest("Invalid date format.");
    }

    let normalizedSchedule: Record<string, BookingSlot> = {};
    const scheduleEntries = Object.entries(reservationInput.dailySchedule || {});
    for (const [dayKey, slot] of scheduleEntries) {
      const day = parseISO(dayKey);
      if (!Number.isNaN(day.getTime())) {
          normalizedSchedule[format(day, "yyyy-MM-dd")] = slot as BookingSlot;
      }
    }

    console.log("[POST /api/bookings] Checking venue:", venueId);
    const venueDoc = await adminDb.collection("venues").doc(venueId).get();
    if (!venueDoc.exists || isArchivedVenue(venueDoc.data() as VenueShape)) {
      return NextResponse.json({ ok: false, error: "Venue not found." }, { status: 404 });
    }

    const venueData = venueDoc.data() as VenueShape;
    const venuePrice = typeof venueData.price === "number" ? venueData.price : null;
    const venueName = typeof venueData.name === "string" ? venueData.name.trim() : "";
    const venueCapacity = typeof venueData.capacity === "number" ? venueData.capacity : null;

    if (!venuePrice || venuePrice <= 0 || !venueName) {
      return serverError("Venue pricing unavailable.");
    }

    if (venueCapacity !== null && guests > venueCapacity) {
      return badRequest(`Guest count exceeds capacity (${venueCapacity}).`);
    }

    // Rate limiting
    const cooldownWindowStart = new Date(Date.now() - BOOKING_COOLDOWN_MS);
    const recentBookingsSnapshot = await adminDb.collection("bookings")
      .where("customer.normalizedEmail", "==", normalizeEmail(customerInput.email))
      .where("customer.normalizedPhone", "==", normalizePhone(customerInput.phone))
      .get();
      
    const isRecentlyBooked = recentBookingsSnapshot.docs.some((snapshot) => {
      const booking = normalizeBookingRecord({ id: snapshot.id, ...snapshot.data() });
      const createdAt = normalizeDate(booking.createdAt);
      return Boolean(createdAt && createdAt.getTime() >= cooldownWindowStart.getTime());
    });

    if (isRecentlyBooked) {
      return tooManyRequests("Rate limit exceeded. Please wait a minute.", "BOOKING_RATE_LIMIT");
    }

    // Availability check
    const existingSnapshot = await adminDb.collection("bookings")
      .where("venueId", "==", venueId)
      .where("status", "in", [...ACTIVE_BOOKING_STATUSES])
      .get();

    for (const [dayKey, requestedSlot] of Object.entries(normalizedSchedule)) {
      const requestDay = parseISO(dayKey);
      const existingSlots = existingSnapshot.docs
        .flatMap((doc) => getExistingSlotsForDay(doc.data() as ExistingBookingShape, requestDay));

      if (hasCollision(existingSlots, requestedSlot)) {
        return NextResponse.json({ ok: false, code: "SLOT_CONFLICT", error: "Slot conflict." }, { status: 409 });
      }
    }

    const referenceId = createReferenceId();
    const finalTimeSlot: BookingSlot | "custom" =
      Object.keys(normalizedSchedule).length > 1 ? "custom" : (Object.values(normalizedSchedule)[0] as BookingSlot) || "full";
    
    const bookingDocument = buildBookingDocument(
      {
        ...body,
        guests,
        venueId,
        customer: customerInput,
        reservation: {
          startDate: reservationInput.startDate,
          endDate: reservationInput.endDate,
          dayCount: Object.keys(normalizedSchedule).length,
          timeSlot: finalTimeSlot,
          dailySchedule: normalizedSchedule,
        },
        pricing: {
          ...(body.pricing ?? {}),
          currency: body.pricing?.currency ?? "MYR",
        },
        customerEmail: customerInput.email,
        customerPhone: customerInput.phone,
        customerName: customerInput.name,
        date: reservationInput.startDate,
        endDate: reservationInput.endDate,
        days: Object.keys(normalizedSchedule).length,
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

    console.log("[POST /api/bookings] Saving document to Firestore...");
    const docRef = await adminDb.collection("bookings").add({
      ...bookingDocument,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdBooking = normalizeBookingRecord({ id: docRef.id, ...bookingDocument });
    
    // Background notification
    sendBookingNotification({
      event: "created",
      booking: createdBooking,
    }).catch(err => console.error("[POST /api/bookings] Notification failed:", err));

    console.log("[POST /api/bookings] Success! Reference:", referenceId);
    return NextResponse.json({ ok: true, bookingId: docRef.id, referenceId }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/bookings] Fatal error:", error.message, error.stack);
    return serverError(`Internal server error: ${error.message}`);
  }
}
