"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Booking } from "@/lib/mockData";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Booking[];
      setBookings(data);
      setLoading(false);
    }, (error) => {
      console.error("useBookings Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const docRef = doc(db, "bookings", id);
      await updateDoc(docRef, { status });
      return { success: true };
    } catch (err) {
      console.error("Update Status Error:", err);
      return { success: false, error: err };
    }
  };

  const getVenueBookings = (venueId: string) => {
    return bookings.filter(b => b.venueId === venueId && (b.status === "approved" || b.status === "pending"));
  };

  const getUserBookings = (email: string, phone: string) => {
    return bookings.filter(b => 
      b.customerEmail?.toLowerCase() === email.toLowerCase() && 
      b.customerPhone?.replace(/[^0-9]/g, "") === phone.replace(/[^0-9]/g, "")
    );
  };

  const stats = {
    total: bookings.length,
    revenue: bookings.filter(b => b.status === 'approved').reduce((acc, b) => acc + (b.totalPrice || 0), 0),
    pending: bookings.filter(b => b.status === 'pending').length,
    rejected: bookings.filter(b => b.status === 'rejected').length
  };

  return { bookings, loading, stats, updateStatus, getVenueBookings, getUserBookings };
}
