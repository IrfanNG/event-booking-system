"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { bookings, venues } from "@/lib/mockData";
import { ShieldAlert, CheckCircle, Loader2, Database } from "lucide-react";
import { AdminSetupGate } from "@/components/admin/AdminSetupGate";
import { isAdminSetupEnabled } from "@/lib/adminRoutes";

export default function AdminSetup() {
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeedLoading(true);
    setError(null);
    try {
      if (!auth.currentUser) {
        throw new Error("Authentication required. Please sign in as an authorized admin before seeding.");
      }

      const batch = writeBatch(db);

      for (const venue of venues) {
        const { id, ...venueData } = venue;
        batch.set(doc(db, "venues", id), {
          ...venueData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const booking of bookings) {
        const { id, ...bookingData } = booking;
        batch.set(doc(db, "bookings", id), {
          ...bookingData,
        });
      }

      await batch.commit();
      setSeedDone(true);
    } catch (err) {
      console.error("Seed Error:", err);
      const error = err as { code?: string; message?: string };
      if (error.code === "permission-denied") {
        setError("Firebase Permission Denied. Ensure your Firestore Rules allow 'write' for authenticated users.");
      } else {
        setError(error.message || "Unknown seeding error.");
      }
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <AdminSetupGate enabled={isAdminSetupEnabled}>
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="w-full max-w-md text-center">
          <ShieldAlert className="mx-auto mb-6 h-12 w-12 text-zinc-900" />
          <h1 className="font-serif text-3xl font-bold tracking-tighter">Admin Setup</h1>
          <p className="mt-4 text-sm text-zinc-500">
            Controlled setup utility for <span className="font-bold text-black">ESPACE</span>. No accounts are created here. Sign in with provisioned admin credentials before running any setup action.
          </p>

          <div className="mt-12 space-y-4">
            {seedDone ? (
              <div className="flex items-center justify-center gap-2 text-green-600 font-bold uppercase tracking-widest text-xs py-4 border-[0.5px] border-green-100 bg-green-50/50">
                <CheckCircle size={16} />
                Venues & Bookings Seeded Successfully
              </div>
            ) : (
              <button
                onClick={handleSeed}
                disabled={seedLoading}
                className="w-full bg-white border-[0.5px] border-zinc-200 py-4 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-50 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {seedLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Database className="h-4 w-4" />}
                Seed Venues & Bookings
              </button>
            )}
          </div>

          {error && (
            <p className="mt-6 text-xs font-medium text-red-500 bg-red-50 p-4 border-[0.5px] border-red-100">
              {error}
            </p>
          )}

          <p className="mt-8 text-[10px] text-zinc-400">
            Setup actions are intentionally opt-in and should remain disabled in production.
          </p>
        </div>
      </div>
    </AdminSetupGate>
  );
}
