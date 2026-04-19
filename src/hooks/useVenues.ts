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
  deleteDoc,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { Venue } from "@/lib/mockData";

export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    const startSync = () => {
      try {
        if (!db) {
          setLoading(false);
          return;
        }

        const q = query(collection(db, "venues"));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          if (!active) return;

          if (snapshot.empty) {
            console.warn("[useVenues] Firestore collection 'venues' is empty.");
            setVenues([]);
          } else {
            const data = snapshot.docs.map(d => ({
              id: d.id,
              ...d.data()
            })) as Venue[];
            
            // Manual sort by createdAt if it exists, or ID as fallback
            const sortedData = [...data].sort((a, b) => {
              const timeA = a.createdAt instanceof Timestamp ? a.createdAt.seconds : 0;
              const timeB = b.createdAt instanceof Timestamp ? b.createdAt.seconds : 0;
              if (timeA !== timeB) return timeB - timeA;
              return b.id.localeCompare(a.id);
            });

            setVenues(sortedData);
            setHasSynced(true);
          }
          setLoading(false);
        }, (error) => {
          console.error("[useVenues] Firestore Sync Error:", error);
          if (active) {
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("[useVenues] Initialization Error:", err);
        if (active) {
          setLoading(false);
        }
      }
    };

    startSync();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const addVenue = async (data: Omit<Venue, "id">) => {
    try {
      await addDoc(collection(db, "venues"), {
        ...data,
        createdAt: serverTimestamp()
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

  const deleteVenue = async (id: string) => {
    try {
      const docRef = doc(db, "venues", id);
      await deleteDoc(docRef);
      return { success: true };
    } catch (err) {
      console.error("Delete Venue Error:", err);
      return { success: false, error: err };
    }
  };

  return { venues, loading, hasSynced, addVenue, updateVenue, deleteVenue };
}
