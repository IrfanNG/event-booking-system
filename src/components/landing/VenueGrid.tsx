"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useVenues } from "@/hooks/useVenues";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const categories = ["Hall", "Studio", "Outdoor", "Office"] as const;

export function VenueGrid() {
  const { t } = useLanguage();
  const { venues, loading } = useVenues();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredVenues = selectedCategory 
    ? venues.filter(v => v.category === selectedCategory)
    : venues;

  if (loading) {
    return (
      <section id="venues" className="w-full bg-white px-6 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-[4/5] bg-zinc-100 border-[0.5px] border-zinc-200" />
                <div className="h-4 w-2/3 bg-zinc-50" />
                <div className="h-4 w-1/2 bg-zinc-50" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="venues" className="w-full bg-white px-6 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between border-b-[0.5px] border-zinc-200 pb-10">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl font-light tracking-tighter text-black md:text-5xl">{t("grid_title")}</h2>
            <p className="mt-4 text-sm font-medium text-zinc-500 leading-relaxed">
              {t("grid_subtitle")}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`text-[10px] font-bold uppercase tracking-widest transition-all ${
                selectedCategory === null ? 'text-black border-b-[1px] border-black pb-1' : 'text-zinc-400 hover:text-black'
              }`}
            >
              {t("grid_all")}
            </button>
            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[10px] font-bold uppercase tracking-widest transition-all ${
                  selectedCategory === cat ? 'text-black border-b-[1px] border-black pb-1' : 'text-zinc-400 hover:text-black'
                }`}
              >
                {cat}s
              </button>
            ))}
          </div>
        </div>

      <motion.div layout className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredVenues.map((venue, idx) => (
            <motion.div
              layout
              key={venue.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <Link href={`/venues/${venue.id}`} className="group block cursor-pointer">
                <div className="relative aspect-[4/5] overflow-hidden border-[0.5px] border-zinc-200 bg-zinc-100 transition-transform group-hover:scale-[0.99]">
                  <Image
                    src={venue.image}
                    alt={venue.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-[0.5px] border-zinc-200 text-black">
                    {venue.category}
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-xl tracking-tight text-black">{venue.name}</h3>
                    <p className="mt-1 text-xs text-zinc-500 uppercase tracking-widest font-bold">{venue.location}</p>
                  </div>
                  <p className="text-sm font-bold tracking-tight text-black">RM {venue.price?.toLocaleString()}</p>
                </div>
                
                <p className="mt-3 text-sm text-zinc-600 line-clamp-2 leading-relaxed tracking-tight">
                  {venue.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {venue.amenities?.slice(0, 3).map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border-[0.5px] border-zinc-200 px-3 py-1 text-[10px] font-medium text-zinc-500 transition-colors hover:border-black hover:text-black"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  </section>
  );
}
