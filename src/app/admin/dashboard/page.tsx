"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Users, CalendarDays, Wallet, Bell, Search, Filter, MoreHorizontal } from "lucide-react";
import Link from "next/link";

const bookings = [
  { id: "#BK-1001", venue: "The Grand Atrium", customer: "Ahmad Ipan", date: "24 May 2026", status: "Confirmed", amount: "RM 5,500" },
  { id: "#BK-1002", venue: "Lumina Studio", customer: "Siti Sarah", date: "15 June 2026", status: "Pending", amount: "RM 1,650" },
  { id: "#BK-1003", venue: "The Emerald Garden", customer: "John Doe", date: "02 July 2026", status: "Cancelled", amount: "RM 3,850" },
  { id: "#BK-1004", venue: "The Grand Atrium", customer: "Creative Agency", date: "12 August 2026", status: "Confirmed", amount: "RM 5,500" },
];

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r-[0.5px] border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black lg:block">
        <div className="flex h-16 items-center border-b-[0.5px] border-zinc-200 px-6 dark:border-zinc-800">
          <Link href="/" className="font-serif text-xl font-bold tracking-tighter text-black dark:text-white">ESPACE ADMIN</Link>
        </div>
        <nav className="p-4 space-y-1">
          <NavItem icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" active />
          <NavItem icon={<CalendarDays className="h-4 w-4" />} label="Bookings" />
          <NavItem icon={<Users className="h-4 w-4" />} label="Customers" />
          <NavItem icon={<Wallet className="h-4 w-4" />} label="Finance" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="flex h-16 items-center justify-between border-b-[0.5px] border-zinc-200 bg-white px-8 dark:border-zinc-800 dark:bg-black">
          <div className="flex items-center gap-4 border-[0.5px] border-zinc-100 px-3 py-1.5 dark:border-zinc-900">
            <Search className="h-4 w-4 text-zinc-400" />
            <input type="text" placeholder="Search booking ID..." className="bg-transparent text-sm outline-none w-48 font-medium" />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </header>

        <div className="p-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="font-serif text-3xl font-light tracking-tighter text-black dark:text-white">Booking Management</h1>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-400">Overview of all reservations</p>
            </div>
            <button className="flex items-center gap-2 border-[0.5px] border-zinc-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">
              <Filter className="h-3 w-3" /> Filter Results
            </button>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Bookings" value="124" trend="+12%" />
            <StatCard label="Revenue" value="RM 42.5k" trend="+8%" />
            <StatCard label="Pending" value="14" />
            <StatCard label="Cancelled" value="3" />
          </div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-[0.5px] border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black"
          >
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-[0.5px] border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Venue</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y-[0.5px] divide-zinc-100 dark:divide-zinc-900">
                {bookings.map((b) => (
                  <tr key={b.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-950/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-black dark:text-white">{b.id}</td>
                    <td className="px-6 py-4 text-xs font-medium text-zinc-600 dark:text-zinc-400 font-serif text-sm">{b.venue}</td>
                    <td className="px-6 py-4 text-xs font-medium text-black dark:text-white">{b.customer}</td>
                    <td className="px-6 py-4 text-xs font-medium text-zinc-500">{b.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
                        b.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-black dark:text-white">{b.amount}</td>
                    <td className="px-6 py-4 text-right">
                      <MoreHorizontal className="h-4 w-4 ml-auto text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex h-12 items-center justify-between border-t-[0.5px] border-zinc-200 px-6 dark:border-zinc-800">
              <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Showing 4 of 124 results</p>
              <div className="flex gap-4">
                <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Previous</button>
                <button className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white">Next</button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
      active ? 'bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-black dark:hover:text-white'
    }`}>
      {icon}
      {label}
    </div>
  );
}

function StatCard({ label, value, trend }: { label: string, value: string, trend?: string }) {
  return (
    <div className="border-[0.5px] border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-black dark:text-white">{value}</h3>
        {trend && <span className="text-[10px] font-bold text-green-600">{trend}</span>}
      </div>
    </div>
  );
}
