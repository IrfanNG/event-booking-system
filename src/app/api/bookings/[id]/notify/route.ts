import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getBookingStatus, normalizeBookingRecord } from "@/lib/bookingNormalization";
import { sendBookingNotification, type BookingNotificationEvent } from "@/lib/bookingNotifications";

type NotifyPayload = {
  event?: BookingNotificationEvent;
};

const allowedEvents = new Set<BookingNotificationEvent>(["approved", "rejected", "cancelled"]);

const mapStatusToEvent = (status: ReturnType<typeof getBookingStatus>): BookingNotificationEvent | null => {
  if (status === "approved" || status === "rejected" || status === "cancelled") {
    return status;
  }

  return null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let payload: NotifyPayload = {};

  try {
    payload = (await request.json()) as NotifyPayload;
  } catch {
    payload = {};
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
    const event = payload.event && allowedEvents.has(payload.event) ? payload.event : mapStatusToEvent(getBookingStatus(booking));

    if (!event) {
      return NextResponse.json({ ok: false, error: "No notification event is available for this booking." }, { status: 400 });
    }

    const notification = await sendBookingNotification({
      event,
      booking,
    });

    return NextResponse.json({
      ok: true,
      notificationStatus: notification.status,
      event: notification.event,
    });
  } catch (error: any) {
    console.error("POST /api/bookings/[id]/notify error:", error.message);
    return NextResponse.json(
      { ok: false, error: `Unable to send notification: ${error.message}` },
      { status: 500 }
    );
  }
}
