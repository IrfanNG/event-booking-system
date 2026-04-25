import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { serverDb } from "@/lib/firebaseServer";
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
  const result = { ...obj };
  Object.keys(result).forEach((key) => {
    if (result[key] === undefined) {
      delete result[key];
    } else if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key]) && !(result[key] instanceof Date)) {
      result[key] = stripUndefined(result[key]);
    }
  });
  return result;
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

    const bookingRef = doc(serverDb, "bookings", id);
    const bookingSnapshot = await getDoc(bookingRef);

    if (!bookingSnapshot.exists()) {
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

    await updateDoc(bookingRef, bookingUpdates);

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
      notificationReason: notification.reason,
    });
  } catch (error) {
    console.error("PATCH /api/bookings/[id]/status global error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to update booking status right now. Please try again." },
      { status: 500 }
    );
  }
}
