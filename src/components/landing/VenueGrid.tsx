"use client";

import Image from "next/image";
import Link from "next/link";
import { venues } from "@/lib/mockData";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export function VenueGrid() {
  const { t } = useLanguage();

  return (
    <section id="venues" className="w-full bg-white px-6 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b-[0.5px] border-zinc-200 pb-6">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl font-light tracking-tighter text-black md:text-5xl">{t("grid_title")}</h2>
            <p className="mt-4 text-sm font-medium text-zinc-500 leading-relaxed">
              {t("grid_subtitle")}
            </p>
          </div>
          <div className="flex gap-8 border-t-[0.5px] border-zinc-100 pt-6 lg:border-none lg:pt-0">
            <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
              {t("grid_all")}
            </button>
            <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
              {t("grid_filtered")}
            </button>
          </div>
        </div>

      <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue, idx) => (
          <Link key={venue.id} href={`/venues/${venue.id}`}>
            <motion.div
              initial={{ y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group block cursor-pointer"
            >
              <div className="relative aspect-[4/5] overflow-hidden border-[0.5px] border-zinc-200 bg-zinc-100 transition-transform group-hover:scale-[0.99]">
                <Image
                  src={venue.image}
                  alt={venue.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest thin-border text-black">
                  {venue.category}
                </div>
              </div>

              <div className="mt-6 flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-xl tracking-tight text-black">{venue.name}</h3>
                  <p className="mt-1 text-xs text-zinc-500 uppercase tracking-widest font-bold">{venue.location}</p>
                </div>
                <p className="text-sm font-bold tracking-tight text-black">RM {venue.price}</p>
              </div>
              
              <p className="mt-3 text-sm text-zinc-600 line-clamp-2 leading-relaxed tracking-tight">
                {venue.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {venue.amenities.slice(0, 3).map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full border-[0.5px] border-zinc-200 px-3 py-1 text-[10px] font-medium text-zinc-500 transition-colors hover:border-black hover:text-black"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  </section>
  );
}
