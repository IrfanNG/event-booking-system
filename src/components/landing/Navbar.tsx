"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

export function Navbar() {
  const [lang, setLang] = useState<"EN" | "BM">("EN");

  return (
    <nav className="sticky top-0 z-50 w-full border-b-[0.5px] border-zinc-200 bg-white/70 backdrop-blur-md dark:border-zinc-800 dark:bg-black/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tighter">
            ESPACE
          </Link>
          <div className="hidden space-x-6 text-sm font-medium tracking-tight text-zinc-500 dark:text-zinc-400 md:flex">
            <Link href="/venues" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">Venues</Link>
            <Link href="/about" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">About</Link>
            <Link href="/contact" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">Contact</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setLang(lang === "EN" ? "BM" : "EN")}
            className="flex h-8 w-12 items-center justify-center border-[0.5px] border-zinc-200 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            {lang}
          </button>
          <button className="bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
            Book Now
          </button>
        </div>
      </div>
    </nav>
  );
}
