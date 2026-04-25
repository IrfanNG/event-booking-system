"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { Booking } from "@/lib/mockData";
import { getBookingStatus, normalizeBookingRecord, toEpochMs, normalizeDate } from "@/lib/bookingNormalization";
import { normalizeEmail, normalizePhone } from "@/lib/contactNormalization";
import { resolveBookingFinance } from "@/lib/finance";
import { onAuthStateChanged } from "firebase/auth";

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

/**
 * Enhanced sort logic to ensure latest bookings always appear at the top.
 * Primary: createdAt (descending)
 * Secondary: event date (descending)
 */
export function sortBookingsLatestFirst(data: Booking[]): Booking[] {
  return [...data].sort((a, b) => {
    const timeA = toEpochMs(a.createdAt);
    const timeB = toEpochMs(b.createdAt);
    if (timeB !== timeA) return timeB - timeA;

    const dateA = normalizeDate(a.date)?.getTime() ?? 0;
    const dateB = normalizeDate(b.date)?.getTime() ?? 0;
    return dateB - dateA;
  });
}

export function useBookings(venueId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    // SECURITY GUARD:
    // If we don't have a specific venueId and the user isn't an admin,
    // don't try to fetch all bookings. This avoids permission errors.
    if (!venueId && !isAdmin) {
      if (loading) setLoading(false);
      return;
    }

    const processSnapshot = (docs: any[]) => {
      if (!active) return;
      const data = docs.map((d) => normalizeBookingRecord({
        id: d.id,
        ...d.data(),
      })) as Booking[];
      setBookings(sortBookingsLatestFirst(data));
      setLoading(false);
    };

    const fetchFromApi = async () => {
      if (!venueId || !active) return;
      try {
        const response = await fetch(`/api/bookings?venueId=${venueId}`);
        const result = await response.json();
        if (result.ok) {
          const data = result.bookings.map((b: any) => normalizeBookingRecord(b)) as Booking[];
          setBookings(sortBookingsLatestFirst(data));
        }
      } catch (err: any) {
        console.error("[useBookings] API Fallback failed:", err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    const startSync = async () => {
      try {
        let q = query(collection(db, "bookings"));
        
        if (venueId) {
          q = query(collection(db, "bookings"), where("venueId", "==", venueId));
        }
        
        // Try live sync
        unsubscribe = onSnapshot(q, (snapshot) => {
          processSnapshot(snapshot.docs);
        }, async (error) => {
          console.warn("[useBookings] onSnapshot failed (likely permissions), falling back to getDocs:", error.message);
          
          // Fallback to one-time fetch
          try {
            const snapshot = await getDocs(q);
            processSnapshot(snapshot.docs);
          } catch (fallbackError: any) {
            console.warn("[useBookings] getDocs failed, falling back to secure API:", fallbackError.message);
            // FINAL FALLBACK: Use API to bypass Client SDK permission issues
            await fetchFromApi();
          }
        });
      } catch (err: any) {
        console.error("[useBookings] Initialization Error:", err.message);
        await fetchFromApi();
      }
    };

    startSync();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [venueId, isAdmin]);

  const findMyBookings = async (email: string, phone: string) => {
    try {
      const response = await fetch(`/api/bookings/lookup?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
      const result = await response.json();
      if (result.ok) {
        // API lookup already returns sorted data, but we sort again here to be safe and consistent
        return sortBookingsLatestFirst(result.bookings as Booking[]);
      }
      throw new Error(result.error || "Failed to lookup bookings");
    } catch (err) {
      console.error("Find My Bookings Error:", err);
      return [];
    }
  };

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
      );
      // Sorting is handled globally by useBookings' effect
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

  return { bookings, loading, stats, updateStatus, getVenueBookings, getUserBookings, findMyBookings };
}
