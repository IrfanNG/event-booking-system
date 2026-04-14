"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, User, ArrowRight } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, any login works
    router.push("/admin/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-12 text-center">
          <h1 className="font-serif text-3xl tracking-tighter text-black dark:text-white">Admin Access</h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Institutional Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full border-[0.5px] border-zinc-200 bg-white py-4 pl-12 pr-4 text-sm font-medium outline-none transition-colors focus:border-black dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-white"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border-[0.5px] border-zinc-200 bg-white py-4 pl-12 pr-4 text-sm font-medium outline-none transition-colors focus:border-black dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-white"
              required
            />
          </div>

          <button
            type="submit"
            className="group flex w-full items-center justify-center gap-2 bg-black py-4 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
          >
            Authenticate
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-medium text-zinc-400">
          Internal use only. ESPACE Security Protocol v3.1
        </p>
      </motion.div>
    </div>
  );
}
