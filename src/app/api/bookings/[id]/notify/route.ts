import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { serverDb } from "@/lib/firebaseServer";
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
    const bookingRef = doc(serverDb, "bookings", id);
    const bookingSnapshot = await getDoc(bookingRef);

    if (!bookingSnapshot.exists()) {
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
      notificationReason: notification.reason,
      event: notification.event,
    });
  } catch (error) {
    console.error("POST /api/bookings/[id]/notify error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to send booking notification right now. Please try again." },
      { status: 500 }
    );
  }
}
