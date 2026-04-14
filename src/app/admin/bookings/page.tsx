"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { format } from "date-fns";

export default function BookingsPage() {
  const { bookings, loading, updateStatus } = useBookings();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBookings = bookings.filter(b => 
    b.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <tr key={b.id} className="group hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-5 text-xs font-bold text-black uppercase tracking-tight">{b.referenceId}</td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-serif font-bold text-black">{b.venueName}</p>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter mt-0.5">{b.timeSlot}</p>
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
                  <td className="px-6 py-5">
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
                      <button className="p-2 hover:bg-zinc-50 text-zinc-300 hover:text-black transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
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
    </div>
  );
}
