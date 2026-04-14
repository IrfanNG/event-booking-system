"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle, Loader2 } from "lucide-react";

export default function AdminSetup() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md text-center">
        <ShieldAlert className="mx-auto mb-6 h-12 w-12 text-zinc-900" />
        <h1 className="font-serif text-3xl font-bold tracking-tighter">Admin Initializer</h1>
        <p className="mt-4 text-sm text-zinc-500">
          This utility will create the <span className="font-bold text-black">admin@espace.com</span> account 
          with password <span className="font-bold text-black">admin123</span> in your Firebase Authentication.
        </p>

        {done ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-8 flex items-center justify-center gap-2 text-green-600 font-bold uppercase tracking-widest text-xs"
          >
            <CheckCircle size={16} />
            Success. You can now login.
          </motion.div>
        ) : (
          <button
            onClick={handleInit}
            disabled={loading}
            className="mt-12 w-full bg-black py-4 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto h-4 w-4" /> : "Run Setup Protocol"}
          </button>
        )}

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
