"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useVenues } from "@/hooks/useVenues";
import { useBookings } from "@/hooks/useBookings";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Shield, Star, Check, Calendar, ArrowLeft, PartyPopper, Plus, Minus, Loader2 } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import { format, addDays, eachDayOfInterval } from "date-fns";
import "react-day-picker/dist/style.css";

import { useLanguage } from "@/context/LanguageContext";
import { type BookingSlot, type CreateBookingPayload, type CreateBookingResponse } from "@/lib/booking";
import { isInactiveBookingStatus, normalizeDate } from "@/lib/bookingNormalization";

export default function VenueDetails() {
  const { id } = useParams();
  const { venues, loading: venuesLoading } = useVenues({ includeArchived: true });
  const { getVenueBookings } = useBookings(id as string);
  const venue = venues.find((v) => v.id === id);
  const isArchived = venue?.isArchived === true;
  const venueBookings = getVenueBookings(id as string);
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [selectedDate, setSelectedDate] = useState<DateRange | undefined>(undefined);
  const [guestCount, setGuestCount] = useState(1);
  const [dailySlots, setDailySlots] = useState<Record<string, BookingSlot>>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSidebarInView, setIsSidebarInView] = useState(false);

  // Generate list of days when range changes
  const selectedDays = useMemo(() => {
    if (!selectedDate?.from || !selectedDate?.to) return selectedDate?.from ? [selectedDate.from] : [];
    try {
      return eachDayOfInterval({ start: selectedDate.from, end: selectedDate.to });
    } catch (e) {
      return [selectedDate.from];
    }
  }, [selectedDate]);

  // Initialize slots for new days
  useEffect(() => {
    const newSlots = { ...dailySlots };
    let changed = false;
    let hasUnavailableDay = false;
    selectedDays.forEach(day => {
      const dStr = format(day, "yyyy-MM-dd");
      const availableSlots = getAvailableSlotsForDate(day);
      if (availableSlots.length === 0) {
        delete newSlots[dStr];
        changed = true;
        hasUnavailableDay = true;
        return;
      }

      const nextSlot = availableSlots[0];
      if (!newSlots[dStr] || !availableSlots.includes(newSlots[dStr])) {
        newSlots[dStr] = nextSlot;
        changed = true;
      }
    });
    if (hasUnavailableDay) {
      setSelectedDate(undefined);
      setBookingError("One or more selected dates are no longer available.");
    }
    if (changed) setDailySlots(newSlots);
  }, [selectedDays, venueBookings]);

  useEffect(() => {
    const handleScroll = () => {
      const sidebar = document.getElementById("booking-sidebar");
      if (sidebar) {
        const rect = sidebar.getBoundingClientRect();
        setIsSidebarInView(rect.top < window.innerHeight - 100);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [bookingStep, setBookingStep] = useState<"idle" | "confirm" | "processing" | "success">("idle");
  const [bookingRef, setBookingRef] = useState("");
  const [bookingError, setBookingError] = useState("");

  // Contact Info State
  const [userData, setUserData] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [botTrap, setBotTrap] = useState("");

  const calendarRef = useRef<HTMLDivElement>(null);

  const getBookingWindow = (booking: (typeof venueBookings)[number]) => {
    const start = normalizeDate(booking.date);
    if (!start) return null;

    const end = normalizeDate(booking.endDate) ?? start;
    if (end < start) return null;

    return { start, end };
  };

  const getBookedSlotsForDate = (booking: (typeof venueBookings)[number], date: Date) => {
    const dayKey = format(date, "yyyy-MM-dd");
    const scheduledSlot = booking.dailySchedule?.[dayKey];

    if (scheduledSlot === "full" || scheduledSlot === "morning" || scheduledSlot === "evening") {
      return [scheduledSlot];
    }

    if (booking.timeSlot === "full" || booking.timeSlot === "morning" || booking.timeSlot === "evening") {
      return [booking.timeSlot];
    }

    if (booking.timeSlot === "custom") {
      return ["full"];
    }

    return [];
  };

  const getAvailableSlotsForDate = (date: Date): BookingSlot[] => {
    const bookedSlots = getActiveBookingsForDate(date).flatMap((booking) => getBookedSlotsForDate(booking, date));
    const booked = new Set(bookedSlots);

    if (booked.has("full") || (booked.has("morning") && booked.has("evening"))) {
      return [];
    }

    return ["full", "morning", "evening"].filter((slot) => {
      if (slot === "full") {
        return booked.size === 0;
      }

      return !booked.has(slot);
    }) as BookingSlot[];
  };

  const getActiveBookingsForDate = (date: Date) => {
    return venueBookings
      .filter(b => {
        if (isInactiveBookingStatus(b.status)) return false;
        const window = getBookingWindow(b);
        if (!window) return false;
        return date >= window.start && date <= window.end;
      });
  };

  const isDateFullyBlocked = (date: Date) => {
    const bookedSlots = getActiveBookingsForDate(date).flatMap((booking) => getBookedSlotsForDate(booking, date));
    return bookedSlots.includes("full") || (bookedSlots.includes("morning") && bookedSlots.includes("evening"));
  };

  const disabledDays = [
    { before: addDays(new Date(), 2) },
    ...venueBookings
      .flatMap((booking) => {
        const window = getBookingWindow(booking);
        if (!window) return [];

        return eachDayOfInterval({ start: window.start, end: window.end }).filter((day) => isDateFullyBlocked(day));
      })
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calculateTotal = () => {
    return calculatePricing().totalAmount;
  };

  const calculatePricing = () => {
    if (!venue || selectedDays.length === 0) {
      return {
        currency: "MYR",
        baseAmount: 0,
        serviceFeeAmount: 0,
        depositAmount: 0,
        refundAmount: 0,
        totalAmount: 0,
      };
    }

    const baseAmount = selectedDays.reduce((acc, day) => {
      const dStr = format(day, "yyyy-MM-dd");
      const slot = dailySlots[dStr] || "full";
      const factor = slot === "full" ? 1 : 0.6;
      return acc + (venue.price * factor);
    }, 0);

    const serviceFeeAmount = baseAmount * 0.1;
    const totalAmount = baseAmount + serviceFeeAmount;

    return {
      currency: "MYR",
      baseAmount: Number(baseAmount.toFixed(2)),
      serviceFeeAmount: Number(serviceFeeAmount.toFixed(2)),
      depositAmount: 0,
      refundAmount: 0,
      totalAmount: Number(totalAmount.toFixed(2)),
    };
  };

  const handleStartBooking = () => {
    if (bookingStep !== "idle") return;
    if (selectedDate?.from && validate()) {
      setBookingError("");
      setBookingStep("confirm");
    }
  };

  const handleFinalConfirm = async () => {
    if (bookingStep === "processing") return;
    if (!venue || !selectedDate?.from) return;
    setBookingError("");
    setBookingStep("processing");

    const ref = `#ES-${format(new Date(), "yyyyMMdd")}-${Math.floor(100 + Math.random() * 900)}`;
    setBookingRef(ref);
    const selectedSchedule = selectedDays.reduce<Record<string, BookingSlot>>((acc, day) => {
      const key = format(day, "yyyy-MM-dd");
      acc[key] = dailySlots[key] || "full";
      return acc;
    }, {});
    const pricing = calculatePricing();

    try {
      const payload: CreateBookingPayload = {
        referenceId: ref,
        venueId: venue.id,
        venueName: venue.name,
        customer: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
        },
        reservation: {
          startDate: format(selectedDate.from, "yyyy-MM-dd"),
          endDate: selectedDate.to ? format(selectedDate.to, "yyyy-MM-dd") : null,
          dayCount: selectedDays.length,
          timeSlot: selectedDays.length > 1 ? "custom" : selectedSchedule[format(selectedDate.from, "yyyy-MM-dd")] || "full",
          dailySchedule: selectedSchedule,
        },
        pricing,
        date: format(selectedDate.from, "yyyy-MM-dd"),
        endDate: selectedDate.to ? format(selectedDate.to, "yyyy-MM-dd") : null,
        days: selectedDays.length,
        dailySchedule: selectedSchedule,
        timeSlot: selectedDays.length > 1 ? "custom" : selectedSchedule[format(selectedDate.from, "yyyy-MM-dd")] || "full",
        guests: guestCount,
        customerName: userData.name,
        customerEmail: userData.email,
        customerPhone: userData.phone,
        totalPrice: pricing.totalAmount,
        website: botTrap,
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as CreateBookingResponse;

      if (!response.ok || !result.ok) {
        const message = !result.ok ? result.error : "Unable to complete booking. Please try again.";
        const errorCode = !result.ok ? result.code : undefined;
        if (response.status === 409 || errorCode === "SLOT_CONFLICT") {
          alert(message);
        } else if (response.status === 429 || errorCode === "BOOKING_RATE_LIMIT" || errorCode === "BOT_DETECTED") {
          setBookingError(message);
        } else {
          setBookingError(message);
        }
        setBookingStep("idle");
        return;
      }

      setBookingRef(result.referenceId);
      setBookingStep("success");
    } catch (error) {
      console.error("Booking Error:", error);
      setBookingError("Unable to complete booking. Please try again.");
      setBookingStep("idle");
    }
  };

  const getSlotValue = (value: string): BookingSlot => {
    if (value === "morning" || value === "evening" || value === "full") return value;
    return "full";
  };
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!userData.name) newErrors.name = t("val_required");
    if (!userData.email) newErrors.email = t("val_required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) newErrors.email = t("val_invalid_email");
    if (!userData.phone) newErrors.phone = t("val_required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  if (venuesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-200" />
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

  if (isArchived) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white text-black px-6 text-center">
        <h1 className="font-serif text-4xl">Venue Archived</h1>
        <p className="mt-4 max-w-md text-sm text-zinc-500">
          This venue is no longer available for new bookings, but its booking history is still preserved in admin records.
        </p>
        <Link href="/" className="mt-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">{t("details_back")}</Link>
      </div>
    );
  }

  const venueName = venue.name;
  const venueLocation = venue.location;
  const venueDescription = venue.description;
  const venueAmenities = venue.amenities;

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-zinc-100">
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b-[0.5px] border-zinc-100 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tighter">ESPACE</Link>
          <div className="flex items-center gap-8">
            <Link href="/#venues" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">{t("nav_venues")}</Link>
            <Link href="/track" className="bg-black text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-opacity hover:opacity-90">My Booking</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 pt-20 pb-12 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mt-0">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mb-2">
              <ArrowLeft className="h-3 w-3" /> {t("details_back")}
            </Link>

            <h1 className="font-serif text-5xl font-light tracking-tighter md:text-7xl mb-4">{venueName}</h1>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8">
              <span className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {venueLocation}</span>
              <span className="flex items-center gap-2 text-black"><Star className="h-3 w-3 fill-black" /> 4.9 {t("details_reviews").replace("{count}", "128")}</span>
            </div>

            <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100 mb-16">
              <Image src={venue.image} alt={venueName} width={1200} height={800} className="h-full w-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" priority />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-y border-zinc-100">
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-zinc-900">
                <Users className="h-4 w-4" /> {t("details_guests").replace("{count}", venue.capacity.toString())}
              </div>
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-zinc-900">
                <Shield className="h-4 w-4" /> {t("details_verified")}
              </div>
            </div>

            <div className="mt-16">
              <h2 className="font-serif text-3xl tracking-tight mb-8">{t("details_about")}</h2>
              <p className="text-base leading-relaxed text-zinc-600 max-w-2xl">{venueDescription}</p>
            </div>

            <div className="mt-16">
              <h2 className="font-serif text-3xl tracking-tight mb-8">{t("details_amenities")}</h2>
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

          {/* Right Column: Sticky Sidebar */}
          <div className="relative" id="booking-sidebar">
            <div className="sticky top-28 border-[0.5px] border-zinc-200 bg-white p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)]">
              <div className="mb-8">
                <span className="text-2xl font-bold text-black font-serif">RM {venue.price.toLocaleString()}</span>
                <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t("sidebar_day")}</span>
              </div>

              <div className="space-y-6">
                {/* Date Range Picker */}
                <div className="relative" ref={calendarRef}>
                  <div 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`border-[0.5px] p-4 transition-all cursor-pointer group ${showCalendar ? 'border-black ring-1 ring-black' : 'border-zinc-200 hover:border-black'}`}
                  >
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black block mb-1">{t("sidebar_date")}</label>
                    <div className="flex items-center justify-between text-sm font-medium text-black">
                      <span>
                        {selectedDate?.from ? (
                          selectedDate.to ? `${format(selectedDate.from, "MMM d")} - ${format(selectedDate.to, "MMM d, yyyy")}` : format(selectedDate.from, "PPP")
                        ) : t("sidebar_select_date")}
                      </span>
                      <Calendar className="h-4 w-4 text-zinc-300" />
                    </div>
                  </div>

                  <AnimatePresence>
                    {showCalendar && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-full mt-2 z-50 bg-white border-[0.5px] border-zinc-200 p-4 shadow-xl custom-calendar">
                        <DayPicker mode="range" selected={selectedDate} onSelect={setSelectedDate} disabled={disabledDays} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Daily Schedule Configurator */}
                {selectedDays.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-zinc-50">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Configure Schedule</label>
                    <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                      {selectedDays.map((day) => {
                        const dStr = format(day, "yyyy-MM-dd");
                        return (
                          <div key={dStr} className="flex items-center justify-between p-3 border border-zinc-100 bg-zinc-50/30">
                            <span className="text-[10px] font-bold text-zinc-900">{format(day, "MMM d")}</span>
                            <select 
                              value={dailySlots[dStr] || "full"}
                              onChange={(e) => setDailySlots({ ...dailySlots, [dStr]: getSlotValue(e.target.value) })}
                              className="text-[10px] font-bold uppercase tracking-tight bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                            >
                              <option value="full" disabled={!getAvailableSlotsForDate(day).includes("full")}>Full Day</option>
                              <option value="morning" disabled={!getAvailableSlotsForDate(day).includes("morning")}>Morning</option>
                              <option value="evening" disabled={!getAvailableSlotsForDate(day).includes("evening")}>Evening</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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

                <div className="space-y-3 pt-4 border-t border-zinc-50">
                  <div className={`border-[0.5px] p-4 transition-colors ${errors.name ? 'border-red-500 bg-red-50/10' : 'border-zinc-200 hover:border-black'} group`}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black block mb-1">{t("sidebar_name")}</label>
                    <input type="text" value={userData.name} placeholder="Jane Doe" onChange={(e) => setUserData({ ...userData, name: e.target.value })} className="w-full text-sm font-medium text-black bg-transparent border-none focus:ring-0 p-0 placeholder:text-zinc-200" />
                  </div>
                  <div className={`border-[0.5px] p-4 transition-colors ${errors.email ? 'border-red-500 bg-red-50/10' : 'border-zinc-200 hover:border-black'} group`}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black block mb-1">{t("sidebar_email")}</label>
                    <input type="email" value={userData.email} placeholder="jane@example.com" onChange={(e) => setUserData({ ...userData, email: e.target.value })} className="w-full text-sm font-medium text-black bg-transparent border-none focus:ring-0 p-0 placeholder:text-zinc-200" />
                  </div>
                  <div className={`border-[0.5px] p-4 transition-colors ${errors.phone ? 'border-red-500 bg-red-50/10' : 'border-zinc-200 hover:border-black'} group`}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black block mb-1">{t("sidebar_phone")}</label>
                    <input type="tel" value={userData.phone} placeholder="+6012-3456789" onChange={(e) => setUserData({ ...userData, phone: e.target.value })} className="w-full text-sm font-medium text-black bg-transparent border-none focus:ring-0 p-0 placeholder:text-zinc-200" />
                  </div>
                </div>
              </div>

                <button 
                  onClick={handleStartBooking} 
                  disabled={!selectedDate?.from || bookingStep !== "idle"} 
                  className={`mt-8 w-full py-4 text-xs font-bold uppercase tracking-widest transition-all ${selectedDate?.from && bookingStep === "idle" ? "bg-black text-white hover:opacity-90 shadow-lg" : "bg-zinc-100 text-zinc-400 cursor-not-allowed"}`}
                >
                  {t("sidebar_reserve")}
                </button>

                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={botTrap}
                    onChange={(e) => setBotTrap(e.target.value)}
                  />
                </div>

                {bookingError && (
                  <p className="mt-4 text-[11px] font-medium text-red-600">{bookingError}</p>
                )}

              <div className="mt-8 space-y-3 pt-6 border-t border-zinc-100">
                  <div className="flex justify-between text-sm text-zinc-500">
                    <span>Subtotal ({selectedDays.length} Days)</span>
                    <span className="font-medium text-black">RM {calculateTotal().toLocaleString()}</span>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {bookingStep === "confirm" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-xl bg-white p-12 border-[0.5px] border-zinc-200 shadow-2xl">
              <h2 className="font-serif text-4xl mb-8">{t("confirm_title")}</h2>
              <div className="space-y-4 mb-12 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                {selectedDays.map(day => (
                  <div key={format(day, "yyyyMMdd")} className="flex justify-between border-b border-zinc-50 pb-2">
                    <span className="text-[10px] font-bold uppercase text-zinc-400">{format(day, "PPP")}</span>
                    <span className="text-xs font-bold uppercase tracking-widest">{dailySlots[format(day, "yyyy-MM-dd")]}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 flex justify-between border-t-2 border-black mb-12">
                <span className="font-serif text-xl">{t("sidebar_total")}</span>
                <span className="text-xl font-bold">RM {calculateTotal().toLocaleString()}</span>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setBookingStep("idle")} className="flex-1 border border-zinc-200 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors">{t("confirm_back")}</button>
                <button onClick={handleFinalConfirm} disabled={bookingStep === "processing"} className="flex-1 bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:opacity-90 shadow-xl disabled:cursor-not-allowed disabled:opacity-60">{t("confirm_final")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {bookingStep === "processing" && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-white/90 backdrop-blur-xl">
            <div className="text-center">
              <div className="mb-4 h-12 w-12 mx-auto animate-spin rounded-full border-b-2 border-black" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">{t("sidebar_confirming")}</p>
            </div>
          </div>
        )}

        {bookingStep === "success" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[220] flex items-center justify-center bg-white px-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="max-w-md text-center">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-50">
                <PartyPopper className="h-12 w-12 text-black" />
              </div>
              <h2 className="font-serif text-5xl tracking-tighter mb-4">{t("success_title")}</h2>
              <div className="mb-8 p-4 bg-zinc-50 border-[0.5px] border-zinc-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{t("success_ref")}</p>
                <p className="text-xl font-bold tracking-tight">{bookingRef}</p>
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

      {/* Sticky Mobile Booking Bar */}
      {!isSidebarInView && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] border-t-[0.5px] border-zinc-200 bg-white/95 backdrop-blur-md px-6 py-4 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <span className="text-xl font-bold text-black font-serif">RM {venue.price.toLocaleString()}</span>
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
      )}

      <style jsx global>{`
        .custom-calendar .rdp-day_selected { background-color: #000 !important; color: #fff !important; border-radius: 0; }
        .custom-calendar .rdp-day_range_middle { background-color: #f4f4f5 !important; color: #000 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
      `}</style>
    </div>
  );
}
