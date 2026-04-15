"use client";

import { useState } from "react";
import { useBookings } from "@/hooks/useBookings";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, MapPin, Clock, ArrowRight, Loader2, Package, CheckCircle2, XCircle, Timer } from "lucide-react";
import Link from "next/link";

export default function TrackBookingPage() {
  const { bookings, loading } = useBookings();
  const { t } = useLanguage();
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const results = bookings.filter(b => 
      b.customerEmail?.toLowerCase() === email.toLowerCase() && 
      b.customerPhone?.replace(/[^0-9]/g, "") === phone.replace(/[^0-9]/g, "")
    );
    
    setFilteredBookings(results);
    setHasSearched(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
            <Timer className="h-3.5 w-3.5" />
            Pending
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 text-black">
      <main className="mx-auto max-w-4xl px-6 py-20">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-serif text-5xl tracking-tighter md:text-7xl mb-6">Track Booking</h1>
          <p className="mx-auto max-w-md text-sm text-zinc-500 leading-relaxed font-medium">
            Enter your booking details to view your current status and history. No reference ID required.
          </p>
        </div>

        {/* Search Form */}
        <div className="mx-auto mb-16 max-w-xl bg-white p-8 border-[0.5px] border-zinc-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)]">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-[0.5px] border-zinc-200 bg-zinc-50/30 px-4 py-3 text-sm font-medium transition-all focus:border-black focus:ring-0 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="0123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border-[0.5px] border-zinc-200 bg-zinc-50/30 px-4 py-3 text-sm font-medium transition-all focus:border-black focus:ring-0 focus:bg-white"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 bg-black py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Find Bookings
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {hasSearched ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <h2 className="font-serif text-2xl tracking-tight">Your History ({filteredBookings.length})</h2>
                {filteredBookings.length > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Showing all records</span>
                )}
              </div>

              {filteredBookings.length > 0 ? (
                <div className="grid gap-6">
                  {filteredBookings.map((booking, idx) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative bg-white border-[0.5px] border-zinc-200 p-8 transition-all hover:border-black hover:shadow-xl"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <h3 className="font-serif text-2xl tracking-tight">{booking.venueName}</h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-sm font-medium text-zinc-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-zinc-300" />
                              {booking.date?.toDate ? format(booking.date.toDate(), "PPP") : booking.date}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-zinc-300" />
                              <span className="capitalize">{booking.timeSlot} Session</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-zinc-300" />
                              Ref: {booking.referenceId || "N/A"}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 border-t md:border-t-0 md:border-l border-zinc-100 pt-6 md:pt-0 md:pl-8">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Paid</span>
                          <span className="text-2xl font-bold font-serif">RM {booking.totalPrice?.toLocaleString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-6 rounded-full bg-zinc-100 p-6">
                    <Search className="h-10 w-10 text-zinc-300" />
                  </div>
                  <h3 className="font-serif text-2xl tracking-tight mb-2">No Bookings Found</h3>
                  <p className="text-sm text-zinc-500 max-w-xs">We couldn't find any bookings associated with that email and phone number.</p>
                  <Link href="/#venues" className="mt-8 text-xs font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-zinc-500 transition-colors">
                    Explore Venues
                  </Link>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <Package className="h-16 w-16 mb-4" />
              <p className="text-xs font-bold uppercase tracking-[0.3em]">Waiting for search...</p>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
