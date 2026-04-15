"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { venues } from "@/lib/mockData";
import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle, Loader2, Database } from "lucide-react";

export default function AdminSetup() {
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInit = async () => {
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, "admin@espace.com", "admin123");
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeedLoading(true);
    setError(null);
    try {
      for (const venue of venues) {
        const { id, ...venueData } = venue;
        await addDoc(collection(db, "venues"), {
          ...venueData,
          createdAt: serverTimestamp()
        });
      }
      setSeedDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md text-center">
        <ShieldAlert className="mx-auto mb-6 h-12 w-12 text-zinc-900" />
        <h1 className="font-serif text-3xl font-bold tracking-tighter">Admin Initializer</h1>
        <p className="mt-4 text-sm text-zinc-500">
          This utility will configure your initial environment for the <span className="font-bold text-black">ESPACE</span> system.
        </p>

        <div className="mt-12 space-y-4">
          {done ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold uppercase tracking-widest text-xs py-4 border-[0.5px] border-green-100 bg-green-50/50">
              <CheckCircle size={16} />
              Admin Account Ready
            </div>
          ) : (
            <button
              onClick={handleInit}
              disabled={loading}
              className="w-full bg-black py-4 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              Create Admin Account
            </button>
          )}

          {seedDone ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold uppercase tracking-widest text-xs py-4 border-[0.5px] border-green-100 bg-green-50/50">
              <CheckCircle size={16} />
              Venues Seeded Successfully
            </div>
          ) : (
            <button
              onClick={handleSeed}
              disabled={seedLoading}
              className="w-full bg-white border-[0.5px] border-zinc-200 py-4 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-50 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {seedLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Database className="h-4 w-4" />}
              Seed Initial Venues
            </button>
          )}
        </div>

        {error && (
          <p className="mt-6 text-xs font-medium text-red-500 bg-red-50 p-4 border-[0.5px] border-red-100">
            {error}
          </p>
        )}

        <p className="mt-8 text-[10px] text-zinc-400">
          Delete this folder (/admin/setup) after successful initialization.
        </p>
      </div>
    </div>
  );
}
