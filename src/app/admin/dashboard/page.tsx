"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, CalendarDays, Wallet, Bell, Search, Filter, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { format } from "date-fns";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(data);
      setLoading(false);
    }, (error) => {
      console.error("Dashboard Fetch Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const docRef = doc(db, "bookings", id);
      await updateDoc(docRef, { status });
    } catch (err) {
      console.error("Update Status Error:", err);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: bookings.length,
    revenue: bookings.filter(b => b.status === 'approved').reduce((acc, b) => acc + (b.totalPrice || 0), 0),
    pending: bookings.filter(b => b.status === 'pending').length,
    rejected: bookings.filter(b => b.status === 'rejected').length
  };

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
        <header className="flex h-16 items-center justify-between border-b-[0.5px] border-zinc-200 bg-white px-8 dark:border-zinc-800 dark:bg-black font-sans">
          <div className="flex items-center gap-4 border-[0.5px] border-zinc-100 px-3 py-1.5 dark:border-zinc-900">
            <Search className="h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search reference or user..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm outline-none w-48 font-medium" 
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              <Bell className="h-4 w-4" />
              {stats.pending > 0 && <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500" />}
            </button>
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border-[0.5px] border-zinc-300" />
          </div>
        </header>

        <div className="p-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="font-serif text-3xl font-light tracking-tighter text-black dark:text-white">Booking Management</h1>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-400">Overview of all reservations from Firebase</p>
            </div>
            <button className="flex items-center gap-2 border-[0.5px] border-zinc-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">
              <Filter className="h-3 w-3" /> Filter Results
            </button>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 font-sans">
            <StatCard label="Total Bookings" value={stats.total.toString()} trend="+Active" />
            <StatCard label="Revenue (Approved)" value={`RM ${stats.revenue.toLocaleString()}`} trend="Live" />
            <StatCard label="Pending" value={stats.pending.toString()} />
            <StatCard label="Rejected" value={stats.rejected.toString()} />
          </div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-[0.5px] border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black overflow-hidden font-sans"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-[0.5px] border-zinc-200 dark:border-zinc-800 bg-zinc-50/50">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Ref ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Venue & Slot</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Customer</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Booking Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-[0.5px] divide-zinc-100 dark:divide-zinc-900">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">Loading data from Firebase...</td>
                    </tr>
                  ) : filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">No bookings found.</td>
                    </tr>
                  ) : filteredBookings.map((b) => (
                    <tr key={b.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-950/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-black dark:text-white uppercase tracking-tight">{b.referenceId}</td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-serif font-bold text-black dark:text-white">{b.venueName}</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">{b.timeSlot}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-black dark:text-white">{b.customerName}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">{b.customerPhone}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-zinc-500">
                        {b.date?.seconds ? format(new Date(b.date.seconds * 1000), "PPP") : "TBD"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          b.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          b.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-black dark:text-white">RM {b.totalPrice?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {b.status === "pending" && (
                            <>
                              <button 
                                onClick={() => updateStatus(b.id, "approved")}
                                className="p-1.5 hover:bg-green-50 text-green-600 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => updateStatus(b.id, "rejected")}
                                className="p-1.5 hover:bg-red-50 text-red-600 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button className="p-1.5 hover:bg-zinc-100 text-zinc-400">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex h-12 items-center justify-between border-t-[0.5px] border-zinc-200 px-6 dark:border-zinc-800">
              <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
                Showing {filteredBookings.length} of {bookings.length} reservations
              </p>
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
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans">{label}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-black dark:text-white">{value}</h3>
        {trend && <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">{trend}</span>}
      </div>
    </div>
  );
}
