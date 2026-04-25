"use client";

import { useMemo, useState } from "react";
import { useBookings } from "@/hooks/useBookings";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, Clock, ArrowRight, Loader2, Package, CheckCircle2, XCircle, Timer, AlertCircle, RotateCcw, Ban } from "lucide-react";
import Link from "next/link";
import { Booking } from "@/lib/mockData";
import { getBookingStatus, normalizeDate } from "@/lib/bookingNormalization";
import { isValidEmail, isValidLookupPhone } from "@/lib/contactNormalization";
import { formatMoney, resolveBookingFinance } from "@/lib/finance";
import { type BookingSlot, type CreateBookingResponse } from "@/lib/booking";
import { canCancelBooking, canRescheduleBooking } from "@/lib/bookingCancellation";

export default function TrackBookingPage() {
  const { findMyBookings } = useBookings();
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState("");
  
  const [actionBooking, setActionBooking] = useState<Booking | null>(null);
  const [actionMode, setActionMode] = useState<"cancel" | "reschedule" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [rescheduleStartDate, setRescheduleStartDate] = useState("");
  const [rescheduleEndDate, setRescheduleEndDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState<BookingSlot>("full");
  const [cancelReason, setCancelReason] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    closeAction();

    if (!isValidEmail(email)) {
      setHasSearched(true);
      setSearchFeedback("Please enter a valid email address.");
      setUserBookings([]);
      return;
    }

    if (!isValidLookupPhone(phone)) {
      setHasSearched(true);
      setSearchFeedback("Please enter a valid phone number.");
      setUserBookings([]);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setSearchFeedback("");

    try {
      const results = await findMyBookings(email, phone);
      setUserBookings(results);
      if (results.length === 0) {
        setSearchFeedback("We couldn't find any bookings with those details. Double-check your email and phone number, then try again.");
      }
    } catch (err) {
      console.error("Search Error:", err);
      setSearchFeedback("Something went wrong. Please try again later.");
    } finally {
      setIsSearching(false);
    }
  };

  const openAction = (booking: Booking, mode: "cancel" | "reschedule") => {
    setActionBooking(booking);
    setActionMode(mode);
    setActionError("");
    setActionMessage("");
    if (mode === "reschedule") {
      const startDate = normalizeDate(booking.date);
      const endDate = normalizeDate(booking.endDate);
      setRescheduleStartDate(startDate ? format(startDate, "yyyy-MM-dd") : "");
      setRescheduleEndDate(endDate ? format(endDate, "yyyy-MM-dd") : "");
      setRescheduleSlot(booking.timeSlot === "morning" || booking.timeSlot === "evening" || booking.timeSlot === "full" ? booking.timeSlot : "full");
      setCancelReason("");
    } else {
      setCancelReason("");
    }
  };

  const closeAction = () => {
    setActionBooking(null);
    setActionMode(null);
    setActionLoading(false);
    setActionError("");
    setActionMessage("");
    setCancelReason("");
    setRescheduleStartDate("");
    setRescheduleEndDate("");
    setRescheduleSlot("full");
  };

  const buildRescheduleSchedule = () => {
    if (!rescheduleStartDate) return null;

    const start = parseISO(rescheduleStartDate);
    if (Number.isNaN(start.getTime())) return null;

    const end = rescheduleEndDate ? parseISO(rescheduleEndDate) : start;
    if (Number.isNaN(end.getTime()) || end < start) return null;

    return eachDayOfInterval({ start, end }).reduce<Record<string, BookingSlot>>((acc, day) => {
      acc[format(day, "yyyy-MM-dd")] = rescheduleSlot;
      return acc;
    }, {});
  };

  const handleCancelBooking = async () => {
    if (!actionBooking) return;

    setActionLoading(true);
    setActionError("");
    setActionMessage("");

    try {
      const response = await fetch(`/api/bookings/${actionBooking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: actionBooking.customerEmail, phone: actionBooking.customerPhone, reason: cancelReason }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !result.ok) {
        setActionError(result.error ?? "Unable to cancel this booking.");
        setActionLoading(false);
        return;
      }

      setActionMessage("Booking cancelled successfully.");
      setActionLoading(false);
      // Refresh list
      const results = await findMyBookings(email, phone);
      setUserBookings(results);
    } catch (error) {
      console.error("Cancel booking error:", error);
      setActionError("Unable to cancel this booking.");
      setActionLoading(false);
    }
  };

  const handleRescheduleBooking = async () => {
    if (!actionBooking) return;

    const dailySchedule = buildRescheduleSchedule();
    if (!dailySchedule) {
      setActionError("Please choose a valid new date range.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionMessage("");

    try {
      const payload = {
        venueId: actionBooking.venueId,
        guests: actionBooking.guests,
        customer: {
          name: actionBooking.customerName,
          email: actionBooking.customerEmail,
          phone: actionBooking.customerPhone,
        },
        reservation: {
          startDate: rescheduleStartDate,
          endDate: rescheduleEndDate || null,
          dayCount: Object.keys(dailySchedule).length,
          timeSlot: Object.keys(dailySchedule).length > 1 ? "custom" : rescheduleSlot,
          dailySchedule,
        },
        date: rescheduleStartDate,
        endDate: rescheduleEndDate || null,
        days: Object.keys(dailySchedule).length,
        dailySchedule,
        timeSlot: Object.keys(dailySchedule).length > 1 ? "custom" : rescheduleSlot,
        customerName: actionBooking.customerName,
        customerEmail: actionBooking.customerEmail,
        customerPhone: actionBooking.customerPhone,
      };

      const response = await fetch(`/api/bookings/${actionBooking.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as CreateBookingResponse & { replacementBookingId?: string };

      if (!response.ok || !result.ok) {
        setActionError(result.error ?? "Unable to reschedule this booking.");
        setActionLoading(false);
        return;
      }

      setActionMessage(`Replacement booking created: ${result.referenceId}`);
      setActionLoading(false);
      // Refresh list
      const results = await findMyBookings(email, phone);
      setUserBookings(results);
    } catch (error) {
      console.error("Reschedule booking error:", error);
      setActionError("Unable to reschedule this booking.");
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: Booking["status"]) => {
    switch (getBookingStatus({ status })) {
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
      case "cancelled":
        return (
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-50 px-2 py-1 rounded-full border border-zinc-200">
            <Ban className="h-3.5 w-3.5" />
            Cancelled
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
              disabled={isSearching}
              className="group flex w-full items-center justify-center gap-2 bg-black py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:opacity-90 disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Find Bookings
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {hasSearched && searchFeedback && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{searchFeedback}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {hasSearched && !isSearching ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <h2 className="font-serif text-2xl tracking-tight">Your History ({userBookings.length})</h2>
                {userBookings.length > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Showing all records</span>
                )}
              </div>

              {userBookings.length > 0 ? (
                <div className="grid gap-6">
                  {userBookings.map((booking, idx) => (
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
                              {(() => {
                                const startDate = normalizeDate(booking.date);
                                const endDate = normalizeDate(booking.endDate);
                                if (startDate && endDate) {
                                  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
                                }
                                if (startDate) {
                                  return format(startDate, "PPP");
                                }
                                return typeof booking.date === "string" ? booking.date : "TBD";
                              })()}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-zinc-300" />
                              <span className="capitalize">{booking.timeSlot === 'custom' ? 'Custom Schedule' : `${booking.timeSlot} Session`}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-zinc-300" />
                              Ref: {booking.referenceId || "N/A"}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 border-t md:border-t-0 md:border-l border-zinc-100 pt-6 md:pt-0 md:pl-8">
                          {(() => {
                            const finance = resolveBookingFinance(booking);
                            return (
                              <div className="flex flex-col items-end gap-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Net Total</span>
                                <span className="text-2xl font-bold font-serif">{formatMoney(finance.netAmount)}</span>
                                <span className="text-[10px] font-medium text-zinc-400 text-right">
                                  Gross {formatMoney(finance.grossAmount)} · Deposit {formatMoney(finance.depositAmount)} · Refund {formatMoney(finance.refundAmount)}
                                </span>
                                {booking.lifecycle?.replacementBookingId && (
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">
                                    Replacement: {booking.lifecycle.replacementBookingId}
                                  </span>
                                )}
                                {(getBookingStatus(booking) === "pending" || getBookingStatus(booking) === "approved") && (
                                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                                    {canCancelBooking(booking) && (
                                      <button
                                        type="button"
                                        onClick={() => openAction(booking, "cancel")}
                                        className="inline-flex items-center gap-2 border border-zinc-200 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:border-zinc-400 hover:text-black"
                                      >
                                        <Ban className="h-3 w-3" />
                                        Cancel
                                      </button>
                                    )}
                                    {canRescheduleBooking(booking) && (
                                      <button
                                        type="button"
                                        onClick={() => openAction(booking, "reschedule")}
                                        className="inline-flex items-center gap-2 bg-black px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:opacity-90"
                                      >
                                        <RotateCcw className="h-3 w-3" />
                                        Reschedule
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
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
                  <p className="text-sm text-zinc-500 max-w-xs">We couldn&apos;t find any bookings associated with that email and phone number.</p>
                  <Link href="/#venues" className="mt-8 text-xs font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-zinc-500 transition-colors">
                    Explore Venues
                  </Link>
                </div>
              )}
            </motion.div>
          ) : isSearching ? (
            <div className="flex flex-col items-center justify-center py-20">
               <Loader2 className="h-12 w-12 animate-spin text-zinc-200 mb-4" />
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Searching History...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <Package className="h-16 w-16 mb-4" />
              <p className="text-xs font-bold uppercase tracking-[0.3em]">Waiting for search...</p>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {actionBooking && actionMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 px-6"
              onClick={closeAction}
            >
              <motion.div
                initial={{ scale: 0.96, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 20 }}
                className="w-full max-w-2xl bg-white border border-zinc-200 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-zinc-100 px-8 py-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Customer Action</p>
                    <h3 className="mt-1 font-serif text-2xl tracking-tight">
                      {actionMode === "cancel" ? "Cancel booking" : "Reschedule booking"}
                    </h3>
                  </div>
                  <button onClick={closeAction} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Close
                  </button>
                </div>

                <div className="grid gap-8 px-8 py-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-zinc-600">
                      {actionBooking.venueName} · {actionBooking.referenceId}
                    </p>
                    <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-600">
                      {actionMode === "cancel" ? (
                        <p>
                          Cancellations follow the public policy window. Refunds depend on how far away the event date is, and the booking will be marked as cancelled.
                        </p>
                      ) : (
                        <p>
                          Reschedules create a new booking and cancel this one. You need at least 7 days before the event starts.
                        </p>
                      )}
                    </div>

                    {actionMessage && (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {actionMessage}
                      </div>
                    )}
                    {actionError && (
                      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {actionError}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {actionMode === "cancel" ? (
                      <>
                        <label className="block space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Reason</span>
                          <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={4}
                            className="w-full border border-zinc-200 px-4 py-3 text-sm focus:border-black focus:outline-none"
                            placeholder="Optional reason for cancellation"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleCancelBooking}
                          disabled={actionLoading}
                          className="w-full bg-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white disabled:opacity-50"
                        >
                          {actionLoading ? "Processing..." : "Confirm cancellation"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">New start date</span>
                            <input
                              type="date"
                              value={rescheduleStartDate}
                              onChange={(e) => setRescheduleStartDate(e.target.value)}
                              className="w-full border border-zinc-200 px-4 py-3 text-sm focus:border-black focus:outline-none"
                            />
                          </label>
                          <label className="block space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">New end date</span>
                            <input
                              type="date"
                              value={rescheduleEndDate}
                              onChange={(e) => setRescheduleEndDate(e.target.value)}
                              className="w-full border border-zinc-200 px-4 py-3 text-sm focus:border-black focus:outline-none"
                            />
                          </label>
                        </div>
                        <label className="block space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Daily slot</span>
                          <select
                            value={rescheduleSlot}
                            onChange={(e) => setRescheduleSlot(e.target.value as BookingSlot)}
                            className="w-full border border-zinc-200 px-4 py-3 text-sm focus:border-black focus:outline-none"
                          >
                            <option value="full">Full Day</option>
                            <option value="morning">Morning</option>
                            <option value="evening">Evening</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={handleRescheduleBooking}
                          disabled={actionLoading}
                          className="w-full bg-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white disabled:opacity-50"
                        >
                          {actionLoading ? "Processing..." : "Create replacement booking"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
