import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { normalizeBookingRecord, normalizeDate } from "@/lib/bookingNormalization";
import { normalizeEmail, normalizePhone } from "@/lib/contactNormalization";

export async function GET(request: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: "Database not initialized" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const email = normalizeEmail(searchParams.get("email"));
    const phone = normalizePhone(searchParams.get("phone"));

    if (!email || !phone) {
      return NextResponse.json({ ok: false, error: "Email and phone are required" }, { status: 400 });
    }

    console.log(`[Lookup] Searching for: ${email} / ${phone}`);

    // Search by normalized email and phone
    const snapshot = await adminDb.collection("bookings")
      .where("customer.normalizedEmail", "==", email)
      .where("customer.normalizedPhone", "==", phone)
      .get();
    
    // Fallback: Some old records might not have normalized fields nested
    let docs = snapshot.docs;
    if (docs.length === 0) {
       const fallbackSnapshot = await adminDb.collection("bookings")
        .where("customerEmail", "==", email)
        .where("customerPhone", "==", phone)
        .get();
       docs = fallbackSnapshot.docs;
    }

    const bookings = docs.map(d => normalizeBookingRecord({
      id: d.id,
      ...d.data()
    })).sort((a, b) => {
      // Sort by creation date descending (latest booking at the top)
      const timeA = normalizeDate(a.createdAt)?.getTime() ?? 0;
      const timeB = normalizeDate(b.createdAt)?.getTime() ?? 0;
      if (timeB !== timeA) return timeB - timeA;
      
      // Fallback: Sort by event date descending
      const dateA = normalizeDate(a.date)?.getTime() ?? 0;
      const dateB = normalizeDate(b.date)?.getTime() ?? 0;
      return dateB - dateA;
    });

    return NextResponse.json({ ok: true, bookings });
  } catch (error: any) {
    console.error("[Lookup] Fatal error:", error.message);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
