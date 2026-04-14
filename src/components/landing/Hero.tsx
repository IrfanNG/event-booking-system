"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative flex min-h-[70vh] w-full flex-col items-center justify-center border-b-[0.5px] border-zinc-200 bg-white px-6 text-center dark:border-zinc-800 dark:bg-black">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl"
      >
        <h1 className="font-serif text-5xl font-light tracking-tighter md:text-7xl lg:text-8.5vw leading-[1.1]">
          Espace. <br />
          Elite Venue Booking for Your Next Moment.
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg text-zinc-500 dark:text-zinc-400 md:text-xl">
          Discover handpicked event spaces designed to elevate every occasion — from minimalist studios to grand atriums.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button className="flex h-12 w-48 items-center justify-center bg-black text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black">
            Explore Venues
          </button>
          <button className="flex h-12 w-48 items-center justify-center border-[0.5px] border-zinc-200 text-sm font-bold uppercase tracking-widest text-zinc-950 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-white dark:hover:bg-zinc-900">
            Learn More
          </button>
        </div>
      </motion.div>

      {/* Subtle bottom detail */}
      <div className="absolute bottom-8 flex w-full justify-between border-t-[0.5px] border-zinc-100 px-6 pt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:border-zinc-900">
        <span>Curated Selection</span>
        <span>Institutional Hospitality</span>
        <span>Est. 2026</span>
      </div>
    </section>
  );
}
