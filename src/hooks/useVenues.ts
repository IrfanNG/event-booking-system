"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from "firebase/firestore";
import { Venue } from "@/lib/mockData";

export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "venues"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Venue[];
      setVenues(data);
      setLoading(false);
    }, (error) => {
      console.error("useVenues Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
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

  return { venues, loading, addVenue, updateVenue, deleteVenue };
}
