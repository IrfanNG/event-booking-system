"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, CheckCircle, XCircle, X, User, Mail, Phone, Calendar, CreditCard, ShieldCheck } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { format } from "date-fns";
import { Booking } from "@/lib/mockData";

export default function BookingsPage() {
  const { bookings, loading, updateStatus } = useBookings();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const filteredBookings = bookings.filter(b => 
    b.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTimeSlotLabel = (slot: string) => {
    switch (slot) {
      case "full": return "Full Day (8AM - 10PM)";
      case "morning": return "Morning (8AM - 1PM)";
      case "evening": return "Evening (2PM - 10PM)";
      default: return slot;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl font-light tracking-tighter text-black">Booking Management</h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Manage all your venue reservations</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-4 border-[0.5px] border-zinc-200 px-3 py-1.5 bg-white">
            <input 
              type="text" 
              placeholder="Filter by name or Ref ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-[11px] outline-none w-48 font-bold uppercase tracking-wider text-black placeholder:text-zinc-300" 
            />
          </div>
          <button className="flex items-center gap-2 border-[0.5px] border-zinc-200 bg-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-zinc-50 shadow-sm">
            <Filter className="h-3 w-3" /> Filter Results
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-[0.5px] border-zinc-200 bg-white overflow-hidden font-sans shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-[0.5px] border-zinc-200 bg-zinc-50/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Ref ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Venue & Slot</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Booking Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-[0.5px] divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-200">Syncing with Firestore...</td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-200">No bookings found.</td>
                </tr>
              ) : filteredBookings.map((b) => (
                <tr 
                  key={b.id} 
                  className="group hover:bg-zinc-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedBooking(b)}
                >
                  <td className="px-6 py-5 text-xs font-bold text-black uppercase tracking-tight">{b.referenceId}</td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-serif font-bold text-black">{b.venueName}</p>
                    <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider mt-1 border-[0.5px] border-zinc-100 px-1.5 py-0.5 inline-block bg-zinc-50/50">
                      {getTimeSlotLabel(b.timeSlot)}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-black">{b.customerName}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">{b.customerPhone}</p>
                  </td>
                  <td className="px-6 py-5 text-xs font-medium text-zinc-500">
                    {b.date?.seconds ? format(new Date(b.date.seconds * 1000), "PPP") : "TBD"}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      b.status === 'approved' ? 'bg-green-50 text-green-700 border-[0.5px] border-green-100' : 
                      b.status === 'pending' ? 'bg-amber-50 text-amber-700 border-[0.5px] border-amber-100' : 
                      'bg-red-50 text-red-700 border-[0.5px] border-red-100'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-black">RM {b.totalPrice?.toLocaleString()}</td>
                  <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {b.status === "pending" && (
                        <>
                          <button 
                            onClick={() => updateStatus(b.id, "approved")}
                            className="p-2 hover:bg-green-50 text-green-600 transition-all border-[0.5px] border-transparent hover:border-green-100 shadow-sm"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => updateStatus(b.id, "rejected")}
                            className="p-2 hover:bg-red-50 text-red-600 transition-all border-[0.5px] border-transparent hover:border-red-100 shadow-sm"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex h-14 items-center justify-between border-t-[0.5px] border-zinc-100 px-6 bg-zinc-50/30">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Total {filteredBookings.length} reservations
          </p>
          <div className="flex gap-6">
            <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 disabled:opacity-50" disabled>Previous</button>
            <button className="text-[10px] font-bold uppercase tracking-widest text-black hover:opacity-70">Next</button>
          </div>
        </div>
      </motion.div>

      {/* Full Details Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white overflow-hidden shadow-2xl border-[0.5px] border-zinc-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-zinc-900 px-8 py-6 text-white">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-1">Reservation Dossier</p>
                  <h2 className="font-serif text-2xl tracking-tight">{selectedBooking.referenceId}</h2>
                </div>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-full p-2 hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8">
                <div className="grid gap-12 md:grid-cols-2">
                  {/* Left Column: Customer Profile */}
                  <div className="space-y-8">
                    <div>
                      <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                        <User className="h-3 w-3" /> Client Profile
                      </h3>
                      <div className="space-y-3">
                        <p className="text-xl font-bold tracking-tight text-black">{selectedBooking.customerName}</p>
                        <div className="flex items-center gap-3 text-sm text-zinc-500 font-medium">
                          <Mail className="h-4 w-4 text-zinc-300" /> {selectedBooking.customerEmail}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-500 font-medium">
                          <Phone className="h-4 w-4 text-zinc-300" /> {selectedBooking.customerPhone}
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-zinc-100">
                      <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                        <Calendar className="h-3 w-3" /> Schedule Details
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-xs text-zinc-400 font-medium">Date</span>
                          <span className="text-xs font-bold text-black">{selectedBooking.date?.seconds ? format(new Date(selectedBooking.date.seconds * 1000), "PPPP") : "TBD"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-zinc-400 font-medium">Time Slot</span>
                          <span className="text-xs font-bold text-black uppercase tracking-tight">{getTimeSlotLabel(selectedBooking.timeSlot)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-zinc-400 font-medium">Guest Count</span>
                          <span className="text-xs font-bold text-black">{selectedBooking.guests} PAX</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Financials & Status */}
                  <div className="space-y-8">
                    <div className="bg-zinc-50 p-6 border-[0.5px] border-zinc-200">
                      <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-6">
                        <CreditCard className="h-3 w-3" /> Financial Audit
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between text-[11px] font-medium text-zinc-500">
                          <span>Base Venue Rate</span>
                          <span>RM {(selectedBooking.totalPrice / 1.1).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-medium text-zinc-500">
                          <span>Service Fee (10%)</span>
                          <span>RM {(selectedBooking.totalPrice - (selectedBooking.totalPrice / 1.1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="h-[0.5px] bg-zinc-200 my-2" />
                        <div className="flex justify-between text-black font-bold">
                          <span className="font-serif text-lg">Total Amount</span>
                          <span className="text-lg">RM {selectedBooking.totalPrice?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                        <ShieldCheck className="h-3 w-3" /> System Metadata
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400">Submission Time</span>
                          <span className="font-bold text-zinc-500">{selectedBooking.createdAt?.seconds ? format(new Date(selectedBooking.createdAt.seconds * 1000), "PPP p") : "N/A"}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400">Venue ID</span>
                          <span className="font-bold text-zinc-500">{selectedBooking.venueId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-12 flex gap-4 pt-8 border-t border-zinc-100">
                  {selectedBooking.status === "pending" ? (
                    <>
                      <button 
                        onClick={() => {
                          updateStatus(selectedBooking.id, "approved");
                          setSelectedBooking(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-black py-4 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve Reservation
                      </button>
                      <button 
                        onClick={() => {
                          updateStatus(selectedBooking.id, "rejected");
                          setSelectedBooking(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 border-[0.5px] border-zinc-200 py-4 text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="h-4 w-4" /> Reject Request
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setSelectedBooking(null)}
                      className="w-full border-[0.5px] border-zinc-200 py-4 text-xs font-bold uppercase tracking-widest text-black hover:bg-zinc-50 transition-colors"
                    >
                      Close Dossier
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
