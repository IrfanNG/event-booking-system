"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useVenues } from "@/hooks/useVenues";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Shield, Star, Check, Calendar, ArrowLeft, PartyPopper, Plus, Minus, X, Loader2 } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, addDays } from "date-fns";
import "react-day-picker/dist/style.css";

import { useLanguage } from "@/context/LanguageContext";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function VenueDetails() {
  const { id } = useParams();
  const { venues, loading: venuesLoading } = useVenues();
  const venue = venues.find((v) => v.id === id);
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [guestCount, setGuestCount] = useState(1);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<"full" | "morning" | "evening">("full");
  const [showCalendar, setShowCalendar] = useState(false);
  const [bookingStep, setBookingStep] = useState<"idle" | "confirm" | "processing" | "success">("idle");
  const [bookingRef, setBookingRef] = useState("");

  // Contact Info State
  const [userData, setUserData] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (venuesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-zinc-200" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white text-black">
        <h1 className="font-serif text-4xl">Venue Not Found</h1>
        <Link href="/" className="mt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">{t("details_back")}</Link>
      </div>
    );
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!userData.name) newErrors.name = t("val_required");
    if (!userData.email) newErrors.email = t("val_required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) newErrors.email = t("val_invalid_email");
    if (!userData.phone) newErrors.phone = t("val_required");
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPriceFactor = () => {
    return selectedTimeSlot === "full" ? 1 : 0.6;
  };

  const calculateTotal = () => {
    const base = venue.price * getPriceFactor();
    const serviceFee = base * 0.1;
    return base + serviceFee;
  };

  const generateRefId = () => {
    const date = format(new Date(), "yyyyMMdd");
    const random = Math.floor(100 + Math.random() * 900);
    return `#ES-${date}-${random}`;
  };

  const handleStartBooking = () => {
    if (selectedDate && validate()) setBookingStep("confirm");
  };

  const handleFinalConfirm = async () => {
    setBookingStep("processing");
    const ref = generateRefId();
    setBookingRef(ref);

    // 10-second timeout to prevent infinite loading on network block
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Request timed out. Please disable any AdBlockers or check your connection.")), 10000)
    );

    try {
      const bookingAction = addDoc(collection(db, "bookings"), {
        referenceId: ref,
        venueId: venue.id,
        venueName: venue.name,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        guests: guestCount,
        customerName: userData.name,
        customerEmail: userData.email,
        customerPhone: userData.phone,
        totalPrice: calculateTotal(),
        status: "pending",
        createdAt: serverTimestamp()
      });

      await Promise.race([bookingAction, timeout]);
      setBookingStep("success");
    } catch (error: any) {
      console.error("Booking Error:", error);
      alert(error.message || "Failed to save booking. Please try again.");
      setBookingStep("idle");
    }
  };

  const getTimeSlotLabel = (slot: string) => {
    if (slot === "full") return t("slot_full");
    if (slot === "morning") return t("slot_morning");
    return t("slot_evening");
  };

  const venueName = venue.name;
  const venueLocation = venue.location;
  const venueDescription = venue.description;
  const venueAmenities = venue.amenities;

  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <main className="mx-auto w-full max-w-7xl px-6 py-12">
        {/* Step-based Modals */}
        <AnimatePresence>
          {bookingStep === "confirm" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-lg bg-white p-12 border-[0.5px] border-zinc-200"
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="font-serif text-4xl tracking-tighter">{t("confirm_title")}</h2>
                    <p className="text-zinc-500 text-sm mt-2">{t("confirm_summary")}</p>
                  </div>
                  <button onClick={() => setBookingStep("idle")} className="p-2 hover:bg-zinc-100 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6 mb-12">
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t("confirm_venue")}</span>
                    <span className="text-sm font-bold">{venueName}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t("confirm_date")}</span>
                    <span className="text-sm font-bold">{selectedDate ? format(selectedDate, "PPP") : ""}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t("confirm_time")}</span>
                    <span className="text-sm font-bold">{getTimeSlotLabel(selectedTimeSlot)}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t("confirm_guest_count")}</span>
                    <span className="text-sm font-bold">{guestCount} {t("sidebar_guests")}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t-2 border-zinc-900">
                    <span className="text-lg font-serif">{t("sidebar_total")}</span>
                    <span className="text-lg font-bold">RM {calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button 
                    onClick={() => setBookingStep("idle")}
                    className="flex-1 border-[0.5px] border-zinc-200 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors"
                  >
                    {t("confirm_back")}
                  </button>
                  <button 
                    onClick={handleFinalConfirm}
                    className="flex-1 bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                  >
                    {t("confirm_final")}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {bookingStep === "processing" && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white/90 backdrop-blur-xl">
              <div className="text-center">
                <div className="mb-4 h-12 w-12 mx-auto animate-spin rounded-full border-b-2 border-black" />
                <p className="text-xs font-bold uppercase tracking-[0.2em]">{t("sidebar_confirming")}</p>
              </div>
            </div>
          )}

          {bookingStep === "success" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-white px-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-md text-center"
              >
                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-50">
                  <PartyPopper className="h-12 w-12 text-black" />
                </div>
                <h2 className="font-serif text-5xl tracking-tighter mb-4">{t("success_title")}</h2>
                <div className="mb-8 p-4 bg-zinc-50 border-[0.5px] border-zinc-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{t("success_ref")}</p>
                  <p className="text-xl font-bold tracking-tight">{bookingRef}</p>
                </div>
                <div className="mb-8 p-4 text-left border-[0.5px] border-zinc-200">
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">{t("confirm_date")}</span>
                    <span className="text-sm font-bold">{selectedDate ? format(selectedDate, "PPP") : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">{t("confirm_time")}</span>
                    <span className="text-sm font-bold">{getTimeSlotLabel(selectedTimeSlot)}</span>
                  </div>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed mb-12">
                  {t("success_msg").replace("{name}", venueName)}
                </p>
                <Link href="/">
                  <button className="w-full bg-black py-4 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90">
                    {t("success_btn")}
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Breadcrumbs */}
        <nav className="mb-8 flex text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <Link href="/#venues" className="flex items-center gap-1 hover:text-black">
            <ArrowLeft className="h-3 w-3" /> {t("details_back")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-black">{venueName}</span>
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
                alt={venueName}
                fill
                className="object-cover"
                priority
              />
            </motion.div>

            {/* Content info */}
            <div className="mt-12 text-black">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h1 className="font-serif text-4xl font-light tracking-tighter md:text-6xl">
                  {venueName}
                </h1>
                <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto">
                  <div className="flex items-center gap-1 text-sm font-bold">
                    <Star className="h-4 w-4 fill-black" />
                    <span>4.9</span>
                    <span className="text-zinc-400">{t("details_reviews").replace("{count}", "24")}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-6 text-sm font-medium text-zinc-500">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {venueLocation}
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

              <div className="mt-12 h-[0.5px] w-full bg-zinc-100" />

              <div className="mt-12">
                <h2 className="font-serif text-3xl tracking-tight mb-6">{t("details_about")}</h2>
                <p className="text-base leading-relaxed text-zinc-600 max-w-2xl">
                  {venueDescription}
                </p>
              </div>

              <div className="mt-12">
                <h2 className="font-serif text-3xl tracking-tight mb-6">{t("details_amenities")}</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                  {venueAmenities.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-zinc-600 pb-3 border-b border-zinc-50">
                      <Check className="h-4 w-4 text-zinc-900" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Sidebar */}
          <div className="relative" id="booking-sidebar">
            <div className="sticky top-28 border-[0.5px] border-zinc-200 bg-white p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)]">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <span className="text-2xl font-bold text-black font-serif">RM {(venue.price * getPriceFactor()).toLocaleString()}</span>
                  <span className="ml-1 text-xs font-bold uppercase tracking-widest text-zinc-400">{t("sidebar_day")}</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Date Picker Trigger */}
                <div className="relative" ref={calendarRef}>
                  <div 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`border-[0.5px] p-4 transition-all cursor-pointer group ${showCalendar ? 'border-black ring-1 ring-black' : 'border-zinc-200 hover:border-black'}`}
                  >
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black block mb-1">{t("sidebar_date")}</label>
                    <div className="flex items-center justify-between text-sm font-medium text-black">
                      <span>{selectedDate ? format(selectedDate, "PPP") : t("sidebar_select_date")}</span>
                      <Calendar className={`h-4 w-4 transition-colors ${selectedDate ? 'text-black' : 'text-zinc-300'}`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {showCalendar && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border-[0.5px] border-zinc-200 p-4 shadow-xl custom-calendar"
                      >
                        <DayPicker
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            setShowCalendar(false);
                          }}
                          disabled={{ before: addDays(new Date(), 3) }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Time Slot Selection */}
                <div className="border-[0.5px] border-zinc-200 p-4 transition-colors hover:border-black group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black block mb-1">{t("sidebar_timeslot")}</label>
                  <select 
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value as any)}
                    className="w-full text-sm font-medium text-black bg-transparent border-none focus:ring-0 p-0 cursor-pointer appearance-none"
                  >
                    <option value="full">{t("slot_full")}</option>
                    <option value="morning">{t("slot_morning")}</option>
                    <option value="evening">{t("slot_evening")}</option>
                  </select>
                </div>

                {/* Guest Input with Stepper */}
                <div className="border-[0.5px] border-zinc-200 p-4 transition-colors hover:border-black group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black block mb-1">{t("sidebar_guests")}</label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        value={guestCount || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setGuestCount(0);
                            return;
                          }
                          const num = parseInt(val);
                          setGuestCount(Math.max(0, Math.min(venue.capacity, num)));
                        }}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => {
                          if (guestCount < 1) setGuestCount(1);
                        }}
                        className="w-20 text-sm font-medium text-black bg-transparent border-none focus:ring-0 p-0"
                      />
                      <span className="text-sm font-medium text-black">{t("sidebar_guests")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                        className="p-1 rounded-full border border-zinc-100 hover:border-black hover:bg-zinc-50 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => setGuestCount(Math.min(venue.capacity, guestCount + 1))}
                        className="p-1 rounded-full border border-zinc-100 hover:border-black hover:bg-zinc-50 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] font-medium text-zinc-400 mt-2 uppercase tracking-wide">
                    {t("sidebar_max_guests").replace("{count}", venue.capacity.toString())}
                  </p>
                </div>

                {/* Contact Info Fields (NEW) */}
                <div className="space-y-4 pt-4 border-t border-zinc-50">
                  <div className={`border-[0.5px] p-4 transition-colors ${errors.name ? 'border-red-500 bg-red-50/10' : 'border-zinc-200 hover:border-black'} group`}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black block mb-1">{t("sidebar_name")}</label>
                    <input 
                      type="text"
                      value={userData.name}
                      placeholder="Jane Doe"
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      className="w-full text-sm font-medium text-black bg-transparent border-none focus:ring-0 p-0 placeholder:text-zinc-200 text-black"
                    />
                    {errors.name && <p className="text-[9px] font-bold text-red-500 uppercase mt-1 tracking-tighter">{errors.name}</p>}
                  </div>

                  <div className={`border-[0.5px] p-4 transition-colors ${errors.email ? 'border-red-500 bg-red-50/10' : 'border-zinc-200 hover:border-black'} group`}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black block mb-1">{t("sidebar_email")}</label>
                    <input 
                      type="email"
                      value={userData.email}
                      placeholder="jane@example.com"
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      className="w-full text-sm font-medium text-black bg-transparent border-none focus:ring-0 p-0 placeholder:text-zinc-200 text-black"
                    />
                    {errors.email && <p className="text-[9px] font-bold text-red-500 uppercase mt-1 tracking-tighter">{errors.email}</p>}
                  </div>

                  <div className={`border-[0.5px] p-4 transition-colors ${errors.phone ? 'border-red-500 bg-red-50/10' : 'border-zinc-200 hover:border-black'} group`}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black block mb-1">{t("sidebar_phone")}</label>
                    <input 
                      type="tel"
                      value={userData.phone}
                      placeholder="+6012-3456789"
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                      className="w-full text-sm font-medium text-black bg-transparent border-none focus:ring-0 p-0 placeholder:text-zinc-200 text-black"
                    />
                    {errors.phone && <p className="text-[9px] font-bold text-red-500 uppercase mt-1 tracking-tighter">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleStartBooking}
                disabled={!selectedDate}
                className={`mt-8 w-full py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                  selectedDate 
                    ? "bg-black text-white hover:opacity-90 shadow-lg shadow-black/10" 
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                }`}
              >
                {t("sidebar_reserve")}
              </button>

              <p className="mt-4 text-center text-[10px] font-medium text-zinc-400">
                {t("sidebar_service_note")}
              </p>

              <div className="mt-8 space-y-3 pt-6 border-t border-zinc-100">
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>{t("sidebar_base")}</span>
                  <span className="font-medium text-black">RM {(venue.price * getPriceFactor()).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>{t("sidebar_fee")}</span>
                  <span className="font-medium text-black">RM {(venue.price * getPriceFactor() * 0.1).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-4 text-black font-bold border-t border-zinc-50">
                  <span className="font-serif text-lg leading-none">{t("sidebar_total")}</span>
                  <span className="text-lg leading-none">RM {calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-24 border-t-[0.5px] border-zinc-200 bg-white py-12 px-6 text-center mb-24 lg:mb-0">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          ESPACE &copy; 2026. ALL RIGHTS RESERVED.
        </p>
      </footer>

      {/* Sticky Mobile Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t-[0.5px] border-zinc-200 bg-white/95 backdrop-blur-md px-6 py-4 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <span className="text-xl font-bold text-black font-serif">RM {(venue.price * getPriceFactor()).toLocaleString()}</span>
            <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t("sidebar_day")}</span>
          </div>
          <button 
            onClick={() => {
              document.getElementById("booking-sidebar")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-black text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-95 transition-transform"
          >
            {t("sidebar_reserve")}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .custom-calendar .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #000;
          --rdp-background-color: #f4f4f5;
          margin: 0;
        }
        .custom-calendar .rdp-day_selected {
          background-color: #000 !important;
          color: #fff !important;
          border-radius: 0;
        }
        .custom-calendar .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: #f4f4f5;
          border-radius: 0;
        }
        .custom-calendar .rdp-head_cell {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #a1a1aa;
        }
        /* Hide arrows for guest input */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
