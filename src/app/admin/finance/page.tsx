"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Clock, CreditCard, ArrowUpRight, BarChart3 } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { format } from "date-fns";

export default function FinancePage() {
  const { bookings, loading, stats } = useBookings();

  // Financial calculations
  const approvedBookings = useMemo(() => bookings.filter(b => b.status === "approved"), [bookings]);
  const pendingRevenue = useMemo(() => 
    bookings.filter(b => b.status === "pending").reduce((acc, b) => acc + (b.totalPrice || 0), 0)
  , [bookings]);

  const avgBookingValue = useMemo(() => 
    approvedBookings.length > 0 ? stats.revenue / approvedBookings.length : 0
  , [stats.revenue, approvedBookings]);

  // Venue Performance Data
  const venuePerformance = useMemo(() => {
    const perfMap = new Map();
    approvedBookings.forEach(b => {
      const name = b.venueName || "Default Venue";
      if (!perfMap.has(name)) {
        perfMap.set(name, { name, revenue: 0, count: 0 });
      }
      const data = perfMap.get(name);
      data.revenue += (b.totalPrice || 0);
      data.count += 1;
    });

    return Array.from(perfMap.values())
      .sort((a, b) => b.revenue - a.revenue);
  }, [approvedBookings]);

  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="font-serif text-4xl font-light tracking-tighter text-black">Financial Overview</h1>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Total revenue and performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="border-[0.5px] border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Gross Revenue</p>
            <Wallet className="h-4 w-4 text-black" />
          </div>
          <h3 className="text-4xl font-bold tracking-tight text-black font-sans">RM {stats.revenue.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-widest">
            <TrendingUp className="h-3 w-3" /> Live Sync
          </div>
        </div>

        <div className="border-[0.5px] border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Potential Revenue</p>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <h3 className="text-4xl font-bold tracking-tight text-black font-sans">RM {pendingRevenue.toLocaleString()}</h3>
          <p className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">From pending bookings</p>
        </div>

        <div className="border-[0.5px] border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Avg. Booking Value</p>
            <CreditCard className="h-4 w-4 text-zinc-400" />
          </div>
          <h3 className="text-4xl font-bold tracking-tight text-black font-sans">RM {avgBookingValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
          <p className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Per approved reservation</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Venue Performance Table */}
        <div className="lg:col-span-1 border-[0.5px] border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <BarChart3 className="h-4 w-4 text-black" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-black">Venue Performance</h2>
          </div>
          <div className="space-y-8">
            {venuePerformance.length === 0 ? (
              <p className="text-[10px] font-bold uppercase text-zinc-300 text-center py-12">No approved revenue yet.</p>
            ) : venuePerformance.map((v) => {
              const percentage = (v.revenue / stats.revenue) * 100;
              return (
                <div key={v.name}>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-xs font-bold text-black">{v.name}</p>
                    <p className="text-[10px] font-bold text-zinc-400">RM {v.revenue.toLocaleString()}</p>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-50 border-[0.5px] border-zinc-100 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-black" 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="lg:col-span-2 border-[0.5px] border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="p-8 border-b-[0.5px] border-zinc-100">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-black">Transaction Ledger</h2>
              <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">Export CSV</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-[0.5px] border-zinc-200 bg-zinc-50/30">
                  <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400">Ref ID</th>
                  <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                  <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400">Recipient</th>
                  <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400">Amount</th>
                  <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y-[0.5px] divide-zinc-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center text-[10px] font-bold uppercase text-zinc-200 tracking-[0.2em]">Syncing Finance Data...</td></tr>
                ) : approvedBookings.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center text-[10px] font-bold uppercase text-zinc-200 tracking-[0.2em]">No transactions recorded.</td></tr>
                ) : approvedBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-8 py-5 text-[11px] font-bold text-black uppercase tracking-tight">{b.referenceId}</td>
                    <td className="px-8 py-5 text-[11px] font-medium text-zinc-500">{b.date?.seconds ? format(new Date(b.date.seconds * 1000), "MMM d, yyyy") : "-"}</td>
                    <td className="px-8 py-5 text-[11px] font-bold text-black">{b.customerName}</td>
                    <td className="px-8 py-5 text-[11px] font-bold text-black">RM {b.totalPrice?.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 hover:bg-zinc-100 text-zinc-300 hover:text-black transition-all">
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-zinc-50/30 border-t-[0.5px] border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">End of financial report</p>
          </div>
        </div>
      </div>
    </div>
  );
}
