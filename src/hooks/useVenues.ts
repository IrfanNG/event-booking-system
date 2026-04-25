"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  getDocs
} from "firebase/firestore";
import { Venue } from "@/lib/mockData";
import { toEpochMs } from "@/lib/bookingNormalization";
import { isArchivedVenue } from "@/lib/venue";

type UseVenuesOptions = {
  includeArchived?: boolean;
};

export function useVenues(options?: UseVenuesOptions) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSynced, setHasSynced] = useState(false);
  const includeArchived = options?.includeArchived ?? false;

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    const processSnapshot = (docs: any[]) => {
      if (!active) return;
      
      const data = docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Venue[];

      const visibleData = includeArchived
        ? data
        : data.filter((venue) => !isArchivedVenue(venue));

      const sortedData = [...visibleData].sort((a, b) => {
        const archivedA = isArchivedVenue(a) ? 1 : 0;
        const archivedB = isArchivedVenue(b) ? 1 : 0;
        if (archivedA !== archivedB) return archivedA - archivedB;
        const timeA = toEpochMs(a.createdAt);
        const timeB = toEpochMs(b.createdAt);
        if (timeA !== timeB) return timeB - timeA;
        return b.id.localeCompare(a.id);
      });

      setVenues(sortedData);
      setHasSynced(true);
      setLoading(false);
    };

    const startSync = async () => {
      try {
        if (!db) {
          setLoading(false);
          return;
        }

        const q = query(collection(db, "venues"));
        
        // Try onSnapshot first for live updates
        unsubscribe = onSnapshot(q, (snapshot) => {
          processSnapshot(snapshot.docs);
        }, async (error) => {
          console.warn("[useVenues] onSnapshot failed (likely permissions), falling back to getDocs:", error.message);
          
          // Fallback to one-time fetch if onSnapshot is blocked
          try {
            const snapshot = await getDocs(q);
            processSnapshot(snapshot.docs);
          } catch (fallbackError: any) {
            console.error("[useVenues] All fetch methods failed:", fallbackError.message);
            if (active) setLoading(false);
          }
        });
      } catch (err: any) {
        console.error("[useVenues] Initialization Error:", err.message);
        if (active) setLoading(false);
      }
    };

    startSync();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [includeArchived]);

  const addVenue = async (data: Omit<Venue, "id">) => {
    try {
      await addDoc(collection(db, "venues"), {
        ...data,
        createdAt: serverTimestamp(),
        isArchived: false,
      });
      return { success: true };
    } catch (err) {
      console.error("Add Venue Error:", err);
      return { success: false, error: err };
    }
  };

  const updateVenue = async (id: string, data: Partial<Omit<Venue, "id">>) => {
    try {
      const docRef = doc(db, "venues", id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error("Update Venue Error:", err);
      return { success: false, error: err };
    }
  };

  const archiveVenue = async (id: string) => {
    try {
      const docRef = doc(db, "venues", id);
      await updateDoc(docRef, {
        isArchived: true,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error("Archive Venue Error:", err);
      return { success: false, error: err };
    }
  };

  return { venues, loading, hasSynced, addVenue, updateVenue, archiveVenue };
}
