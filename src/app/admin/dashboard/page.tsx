"use client";

import { motion } from "framer-motion";
import { useBookings } from "@/hooks/useBookings";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const { bookings, loading, stats } = useBookings();

  // Show only top 5 recent bookings on dashboard
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="font-serif text-4xl font-light tracking-tighter text-black">Dashboard Overview</h1>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Welcome back, Boss.</p>
      </div>

      {/* Stats */}
      <div className="mb-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 font-sans">
        <StatCard label="Total Bookings" value={stats.total.toString()} trend="+Active" />
        <StatCard label="Revenue (Approved)" value={`RM ${stats.revenue.toLocaleString()}`} trend="Live Sync" />
        <StatCard label="Pending" value={stats.pending.toString()} />
        <StatCard label="Rejected" value={stats.rejected.toString()} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Bookings Table (Simplified) */}
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-2xl tracking-tight">Recent Reservations</h2>
            <Link href="/admin/bookings" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-[0.5px] border-zinc-200 bg-white overflow-hidden font-sans shadow-sm"
          >
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-[0.5px] border-zinc-200 bg-zinc-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Ref ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-[0.5px] divide-zinc-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-[10px] font-bold uppercase text-zinc-300">Syncing...</td></tr>
                ) : recentBookings.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-[10px] font-bold uppercase text-zinc-300">No data found.</td></tr>
                ) : recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-6 py-4 text-xs font-bold text-black uppercase">{b.referenceId}</td>
                    <td className="px-6 py-4 text-xs font-medium text-black">{b.customerName}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{b.date?.seconds ? format(new Date(b.date.seconds * 1000), "MMM d") : "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                        b.status === 'approved' ? 'bg-green-50 text-green-700' : 
                        b.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>

        {/* Quick Tips / Actions */}
        <div className="space-y-6">
          <h2 className="font-serif text-2xl tracking-tight">System Status</h2>
          <div className="border-[0.5px] border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Firestore Sync</p>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">Connected Live</span>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
              The dashboard is currently syncing with the `event-booking-system-25020` database.
            </p>
          </div>
          <div className="border-[0.5px] border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Help Center</p>
            <p className="text-[11px] leading-relaxed text-zinc-500 mb-4">
              Need to manage venues or change pricing? Manual updates can be performed in the Firebase Console.
            </p>
            <button className="text-[10px] font-bold uppercase tracking-widest text-black underline underline-offset-4">
              Open Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend }: { label: string, value: string, trend?: string }) {
  return (
    <div className="border-[0.5px] border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 font-sans">{label}</p>
      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-3xl font-bold tracking-tight text-black">{value}</h3>
        {trend && <span className="text-[10px] font-bold text-green-600 uppercase tracking-[0.1em]">{trend}</span>}
      </div>
    </div>
  );
}
