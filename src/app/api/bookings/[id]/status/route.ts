import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getBookingStatus, normalizeBookingRecord } from "@/lib/bookingNormalization";
import { sendBookingNotification, type BookingNotificationEvent } from "@/lib/bookingNotifications";
import { verifyAdminSession } from "@/lib/authServer";

type StatusPayload = {
  status?: "approved" | "rejected";
};

const allowedStatuses = new Set<NonNullable<StatusPayload["status"]>>(["approved", "rejected"]);

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized access." }, { status: 401 });
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj } as any;
  Object.keys(result).forEach((key) => {
    if (result[key] === undefined) {
      delete result[key];
    } else if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key]) && !(result[key] instanceof Date)) {
      result[key] = stripUndefined(result[key]);
    }
  });
  return result as T;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return unauthorized();
    }

    if (!adminDb) {
      return NextResponse.json({ ok: false, error: "Database connection not initialized." }, { status: 500 });
    }

    const { id } = await params;
    let payload: StatusPayload = {};

    try {
      payload = (await request.json()) as StatusPayload;
    } catch {
      return badRequest("Invalid JSON payload.");
    }

    if (!payload.status || !allowedStatuses.has(payload.status)) {
      return badRequest("Invalid status.");
    }

    const bookingRef = adminDb.collection("bookings").doc(id);
    const bookingSnapshot = await bookingRef.get();

    if (!bookingSnapshot.exists) {
      return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
    }

    const booking = normalizeBookingRecord({ id: bookingSnapshot.id, ...bookingSnapshot.data() });
    const currentStatus = getBookingStatus(booking);

    if (currentStatus !== "pending") {
      return NextResponse.json(
        { ok: false, error: "Only pending bookings can be approved or rejected." },
        { status: 409 }
      );
    }

    const now = new Date();
    const notificationEvent: BookingNotificationEvent = payload.status;

    const bookingUpdates = stripUndefined({
      status: payload.status,
      updatedAt: now,
      statusUpdatedAt: now,
      lifecycle: {
        ...booking.lifecycle,
        status: payload.status,
        updatedAt: now,
        statusUpdatedAt: now,
        ...(payload.status === "approved"
          ? { approvedAt: now }
          : { rejectedAt: now }),
      },
      ...(payload.status === "approved"
        ? { approvedAt: now }
        : { rejectedAt: now }),
    });

    await bookingRef.update(bookingUpdates);

    const updatedBooking = normalizeBookingRecord({
      ...booking,
      ...bookingUpdates,
      id,
    });

    const notification = await sendBookingNotification({
      event: notificationEvent,
      booking: updatedBooking,
    });

    if (notification.status === "failed") {
      console.error("Status notification failed:", notification.reason);
    }

    return NextResponse.json({
      ok: true,
      status: payload.status,
      notificationStatus: notification.status,
    });
  } catch (error: any) {
    console.error("PATCH /api/bookings/[id]/status error:", error.message);
    return NextResponse.json(
      { ok: false, error: `Unable to update: ${error.message}` },
      { status: 500 }
    );
  }
}
