"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { venues } from "@/lib/mockData";
import { Navbar } from "@/components/landing/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Shield, Star, Check, Calendar, ArrowLeft, PartyPopper } from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";

export default function VenueDetails() {
  const { id } = useParams();
  const venue = venues.find((v) => v.id === id);
  const { lang, setLang, t } = useLanguage();
  const [isBooking, setIsBooking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!venue) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white text-black">
        <h1 className="font-serif text-4xl">Venue Not Found</h1>
        <Link href="/" className="mt-4 text-zinc-500 hover:underline">{t("details_back")}</Link>
      </div>
    );
  }

  const handleBooking = () => {
    setIsBooking(true);
    // Simulate API call
    setTimeout(() => {
      setIsBooking(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-6 py-12">
        {/* Success Modal */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-xl px-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-md text-center"
              >
                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100">
                  <PartyPopper className="h-12 w-12 text-black" />
                </div>
                <h2 className="font-serif text-4xl tracking-tighter">{t("success_title")}</h2>
                <p className="mt-4 text-sm font-medium text-zinc-600">
                  {t("success_msg").replace("{name}", venue.name)}
                </p>
                <Link href="/">
                  <button className="mt-12 w-full bg-black py-4 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90">
                    {t("success_btn")}
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Breadcrumbs */}
        <nav className="mb-8 flex text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <Link href="/" className="flex items-center gap-1 hover:text-black">
            <ArrowLeft className="h-3 w-3" /> {t("details_back")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-black">{venue.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-3">
          {/* Left Column: Gallery & Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-video overflow-hidden border-[0.5px] border-zinc-200 bg-zinc-100"
            >
              <Image
                src={venue.image}
                alt={venue.name}
                fill
                className="object-cover"
                priority
              />
            </motion.div>

            {/* Content info */}
            <div className="mt-12">
              <div className="flex items-center justify-between">
                <h1 className="font-serif text-4xl font-light tracking-tighter md:text-6xl">
                  {venue.name}
                </h1>
                <div className="flex items-center gap-1 text-sm font-bold text-black">
                  <Star className="h-4 w-4 fill-black" />
                  <span>4.9</span>
                  <span className="text-zinc-400">{t("details_reviews").replace("{count}", "24")}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-6 text-sm font-medium text-zinc-500">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {venue.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("details_guests").replace("{count}", venue.capacity.toString())}
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t("details_verified")}
                </div>
              </div>

              <div className="mt-12 h-[0.5px] w-full bg-zinc-200" />

              <div className="mt-12">
                <h2 className="font-serif text-2xl tracking-tight text-black">{t("details_about")}</h2>
                <p className="mt-4 text-base leading-relaxed text-zinc-600">
                  {venue.description}
                  {" "}This premium venue offers state-of-the-art facilities designed for high-end events. 
                  Whether you're hosting a corporate seminar, an intimate celebration, or a creative workshop, 
                  our space adapts to your vision with seamless institutional hospitality.
                </p>
              </div>

              <div className="mt-12">
                <h2 className="font-serif text-2xl tracking-tight text-black">{t("details_amenities")}</h2>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {venue.amenities.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-zinc-600">
                      <Check className="h-4 w-4 text-zinc-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Sidebar */}
          <div className="relative">
            <div className="sticky top-28 border-[0.5px] border-zinc-200 bg-white p-8 shadow-sm">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold text-black">RM {venue.price}</span>
                  <span className="ml-1 text-xs font-bold uppercase tracking-widest text-zinc-400">{t("sidebar_day")}</span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="border-[0.5px] border-zinc-200 p-4 transition-colors hover:border-black cursor-pointer group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black">{t("sidebar_date")}</label>
                  <div className="mt-1 flex items-center justify-between text-sm font-medium text-black">
                    <span>{t("sidebar_select_date")}</span>
                    <Calendar className="h-4 w-4 text-zinc-400" />
                  </div>
                </div>
                <div className="border-[0.5px] border-zinc-200 p-4 transition-colors hover:border-black cursor-pointer group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black">{t("sidebar_guests")}</label>
                  <div className="mt-1 flex items-center justify-between text-sm font-medium text-black">
                    <span>50 {t("sidebar_guests")}</span>
                    <Users className="h-4 w-4 text-zinc-400" />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleBooking}
                disabled={isBooking}
                className="mt-8 w-full bg-black py-4 text-xs font-bold uppercase tracking-widest text-white transition-all hover:opacity-90 disabled:bg-zinc-300 disabled:cursor-not-allowed"
              >
                {isBooking ? t("sidebar_confirming") : t("sidebar_reserve")}
              </button>

              <p className="mt-4 text-center text-[10px] font-medium text-zinc-400">
                {t("sidebar_service_note")}
              </p>

              <div className="mt-8 space-y-3">
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>{t("sidebar_base")}</span>
                  <span>RM {venue.price}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>{t("sidebar_fee")}</span>
                  <span>RM {venue.price * 0.1}</span>
                </div>
                <div className="mt-4 h-[0.5px] w-full bg-zinc-100 dark:bg-zinc-900" />
                <div className="flex justify-between pt-2 text-black font-bold">
                  <span>{t("sidebar_total")}</span>
                  <span>RM {venue.price * 1.1}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-24 border-t-[0.5px] border-zinc-200 bg-white py-12 px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          ESPACE &copy; 2026. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}
