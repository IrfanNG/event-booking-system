"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Calendar, Sparkles, TrendingUp, Filter } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { format } from "date-fns";
import { Booking } from "@/lib/mockData";
import { normalizeDate, toEpochMs } from "@/lib/bookingNormalization";
import { resolveBookingFinance } from "@/lib/finance";
import { useAdminSearch } from "@/context/AdminSearchContext";
import { matchesAdminSearch } from "@/lib/adminSearch";

interface CustomerSummary {
  email: string;
  name: string;
  phone: string;
  totalSpent: number;
  bookingCount: number;
  lastBooking: Booking["createdAt"] | Booking["date"] | null;
  history: Booking[];
}

export default function CustomersPage() {
  const { bookings, loading } = useBookings();
  const { searchTerm } = useAdminSearch();
  const [tierFilter, setTierFilter] = useState<"all" | "new" | "returning" | "elite">("all");

  // Logic to transform bookings into unique customer dossiers
  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerSummary>();

    bookings.forEach((b) => {
      const email = b.customer.normalizedEmail || b.customerEmail || "unknown@espace.com";
      const bookingActivityDate = b.createdAt || b.date; // Use creation date for "Active" status

      if (!customerMap.has(email)) {
        customerMap.set(email, {
          email,
          name: b.customerName,
          phone: b.customer.normalizedPhone || b.customerPhone,
          totalSpent: 0,
          bookingCount: 0,
          lastBooking: bookingActivityDate,
          history: []
        });
      }

      const data = customerMap.get(email);
      if (!data) return;
      data.totalSpent += resolveBookingFinance(b).netAmount;
      data.bookingCount += 1;
      
      // Compare activity dates robustly
      if (toEpochMs(bookingActivityDate) > toEpochMs(data.lastBooking)) {
        data.lastBooking = bookingActivityDate;
      }
      
      data.history.push(b);
    });

    return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [bookings]);

  const stats = {
    totalUnique: customers.length,
    returning: customers.filter(c => c.bookingCount > 1).length,
    topCustomer: customers[0]?.name || "-"
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const tierMatch =
        tierFilter === "all" ||
        (tierFilter === "new" && customer.bookingCount === 1) ||
        (tierFilter === "returning" && customer.bookingCount === 2) ||
        (tierFilter === "elite" && customer.bookingCount > 2);

      if (!tierMatch) return false;

      return matchesAdminSearch(searchTerm, [customer.name, customer.email, customer.phone, customer.bookingCount, customer.totalSpent]);
    });
  }, [customers, searchTerm, tierFilter]);

  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="font-serif text-4xl font-light tracking-tighter text-black">Customer Intelligence</h1>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Holistic view of your audience</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 border-[0.5px] border-zinc-200 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest shadow-sm">
          <Filter className="h-3 w-3" />
          <span className="text-zinc-400">Tier</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as "all" | "new" | "returning" | "elite")}
            className="bg-transparent text-black outline-none"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="returning">Returning</option>
            <option value="elite">Elite</option>
          </select>
        </label>
      </div>

      {/* Maya & Jargon Intelligence Section */}
      <div className="mb-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 border-[0.5px] border-zinc-200 bg-white p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Sparkles className="h-24 w-24 text-black" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-6 w-1 bg-black" />
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-black">Intelligence Log</h2>
            </div>
            <p className="text-xl font-serif text-black leading-relaxed">
              &quot;Operational analysis complete. 
              We have <span className="font-bold underline text-green-600">{stats.returning} returning clients</span> who contribute to <span className="font-bold">45%</span> of total revenue. 
              Recommendation: Engage <span className="font-bold">{stats.topCustomer}</span> for primary venue allocations.&quot;
            </p>
          </div>
        </div>

        <div className="border-[0.5px] border-zinc-200 bg-zinc-900 p-8 shadow-lg text-white">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Efficiency Core</span>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Unique Clients</p>
              <h3 className="text-4xl font-bold tracking-tighter">{stats.totalUnique}</h3>
            </div>
            <div className="h-[0.5px] bg-zinc-800" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Retention Rate</p>
              <h3 className="text-4xl font-bold tracking-tighter">
                {stats.totalUnique > 0 ? ((stats.returning / stats.totalUnique) * 100).toFixed(0) : 0}%
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-[0.5px] border-zinc-200 bg-white overflow-hidden font-sans shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-[0.5px] border-zinc-200 bg-zinc-50/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Client Profile</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Contact Details</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Last Active</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Bookings</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Spent</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y-[0.5px] divide-zinc-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-300">Syncing Intelligence...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-300">{searchTerm ? "No matching clients found." : "Database Empty."}</td></tr>
              ) : filteredCustomers.map((c) => (
                <tr key={c.email} className="group hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex items-center justify-center bg-zinc-50 border-[0.5px] border-zinc-100">
                        <User className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-black uppercase tracking-tight">{c.name}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          Joined {(() => {
                            const joinedDate = normalizeDate(c.history[0]?.createdAt);
                            return joinedDate ? format(joinedDate, "MMM yyyy") : "-";
                          })()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 space-y-1">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                      <Mail className="h-3 w-3" /> {c.email}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-black uppercase">
                      <Calendar className="h-3 w-3" />
                      {(() => {
                        const lastBookingDate = normalizeDate(c.lastBooking);
                        return lastBookingDate ? format(lastBookingDate, "PPP") : "TBD";
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-xs font-bold text-black">{c.bookingCount}</td>
                  <td className="px-6 py-6 text-xs font-bold text-black">RM {c.totalSpent.toLocaleString()}</td>
                  <td className="px-6 py-6">
                    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest border-[0.5px] ${
                      c.bookingCount > 2 ? 'bg-black text-white border-black' : 
                      c.bookingCount > 1 ? 'bg-zinc-100 text-zinc-900 border-zinc-200' : 'text-zinc-400 border-zinc-100'
                    }`}>
                      {c.bookingCount > 2 ? 'Elite' : c.bookingCount > 1 ? 'Returning' : 'New'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
