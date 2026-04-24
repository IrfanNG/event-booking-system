import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { serverDb } from "@/lib/firebaseServer";
import { calculateCancellationQuote, canCancelBooking } from "@/lib/bookingCancellation";
import { getBookingStatus, normalizeBookingRecord } from "@/lib/bookingNormalization";
import { isValidEmail, normalizeEmail, normalizePhone } from "@/lib/contactNormalization";
import { sendBookingNotification } from "@/lib/bookingNotifications";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let payload: { email?: string; phone?: string; reason?: string };

  try {
    payload = (await request.json()) as { email?: string; phone?: string; reason?: string };
  } catch {
    return badRequest("Invalid JSON payload.");
  }

  const normalizedEmail = normalizeEmail(payload.email);
  const normalizedPhone = normalizePhone(payload.phone);

  if (!isValidEmail(normalizedEmail)) {
    return badRequest("Invalid email.");
  }

  if (!normalizedPhone) {
    return badRequest("Invalid phone.");
  }

  try {
    const bookingRef = doc(serverDb, "bookings", id);
    const bookingSnapshot = await getDoc(bookingRef);

    if (!bookingSnapshot.exists()) {
      return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
    }

    const booking = normalizeBookingRecord({ id: bookingSnapshot.id, ...bookingSnapshot.data() });

    if (getBookingStatus(booking) === "cancelled") {
      return NextResponse.json({ ok: false, error: "Booking is already cancelled." }, { status: 409 });
    }

    if (getBookingStatus(booking) === "rejected") {
      return NextResponse.json({ ok: false, error: "Rejected bookings cannot be cancelled." }, { status: 409 });
    }

    if (booking.customer.normalizedEmail !== normalizedEmail || booking.customer.normalizedPhone !== normalizedPhone) {
      return NextResponse.json({ ok: false, error: "This booking does not belong to the provided contact details." }, { status: 403 });
    }

    if (!canCancelBooking(booking)) {
      return NextResponse.json({ ok: false, error: "Bookings can only be cancelled before the reservation starts." }, { status: 400 });
    }

    const quote = calculateCancellationQuote(booking);
    if (!quote) {
      return NextResponse.json({ ok: false, error: "Unable to calculate cancellation refund." }, { status: 500 });
    }

    const now = new Date();
    await updateDoc(bookingRef, {
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
        cancelReason: payload.reason?.trim() || "Cancelled by customer",
      }),
    });

    const cancelledBooking = {
      ...booking,
      status: "cancelled" as const,
      lifecycle: {
        ...booking.lifecycle,
        status: "cancelled" as const,
        updatedAt: now,
        cancelledAt: now,
        statusUpdatedAt: now,
        cancelledBy: "customer" as const,
        cancelReason: payload.reason?.trim() || "Cancelled by customer",
      },
      updatedAt: now,
      cancelledAt: now,
      statusUpdatedAt: now,
    };

    const notification = await sendBookingNotification({
      event: "cancelled",
      booking: cancelledBooking,
      reason: payload.reason?.trim() || "Cancelled by customer",
    });

    if (notification.status === "failed") {
      console.error("Cancellation notification failed:", notification.reason);
    }

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      refundAmount: quote.refundAmount,
      retainedAmount: quote.retainedAmount,
      daysUntilStart: quote.daysUntilStart,
      notificationStatus: notification.status,
      notificationReason: notification.reason,
    });
  } catch (error) {
    console.error("POST /api/bookings/[id]/cancel error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to cancel the booking right now. Please try again." },
      { status: 500 }
    );
  }
}
