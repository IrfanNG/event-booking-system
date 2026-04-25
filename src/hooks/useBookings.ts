"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Booking } from "@/lib/mockData";
import { getBookingStatus, normalizeBookingRecord, toEpochMs } from "@/lib/bookingNormalization";
import { normalizeEmail, normalizePhone } from "@/lib/contactNormalization";
import { resolveBookingFinance } from "@/lib/finance";

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "bookings"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => normalizeBookingRecord({
        id: d.id,
        ...d.data(),
      })) as Booking[];
      setBookings([...data].sort((a, b) => toEpochMs(b.createdAt) - toEpochMs(a.createdAt)));
      setLoading(false);
    }, (error) => {
      console.error("useBookings Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Unauthorized: No active session found.");
      }

      const response = await fetch(`/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to update booking status.");
      }

      return { success: true, result };
    } catch (err) {
      console.error("Update Status Error:", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const getVenueBookings = (venueId: string) => {
    return bookings.filter((b) => {
      const status = getBookingStatus(b);
      return b.venueId === venueId && (status === "approved" || status === "pending");
    });
  };

  const getUserBookings = (email: string, phone: string) => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    return bookings
      .filter(
      (b) =>
        normalizeEmail(b.customer.normalizedEmail || b.customerEmail) === normalizedEmail &&
        normalizePhone(b.customer.normalizedPhone || b.customerPhone) === normalizedPhone
      )
      .sort((a, b) => {
        const priority = (status: string) => {
          if (status === "pending") return 0;
          if (status === "approved") return 1;
          if (status === "cancelled") return 2;
          return 3;
        };

        const statusDelta = priority(getBookingStatus(a)) - priority(getBookingStatus(b));
        if (statusDelta !== 0) return statusDelta;

        return toEpochMs(b.createdAt) - toEpochMs(a.createdAt);
      });
  };

  const stats = {
    total: bookings.length,
    revenue: bookings.filter((b) => getBookingStatus(b) === "approved").reduce((acc, b) => acc + resolveBookingFinance(b).netAmount, 0),
    grossRevenue: bookings.filter((b) => getBookingStatus(b) === "approved").reduce((acc, b) => acc + resolveBookingFinance(b).grossAmount, 0),
    depositsHeld: bookings.filter((b) => {
      const status = getBookingStatus(b);
      return status === "pending" || status === "approved";
    }).reduce((acc, b) => acc + resolveBookingFinance(b).depositAmount, 0),
    refundsIssued: bookings.filter((b) => {
      const status = getBookingStatus(b);
      return status === "rejected" || status === "cancelled";
    }).reduce((acc, b) => acc + resolveBookingFinance(b).refundAmount, 0),
    pending: bookings.filter((b) => getBookingStatus(b) === "pending").length,
    rejected: bookings.filter((b) => getBookingStatus(b) === "rejected").length,
    cancelled: bookings.filter((b) => getBookingStatus(b) === "cancelled").length,
  };

  return { bookings, loading, stats, updateStatus, getVenueBookings, getUserBookings };
}
