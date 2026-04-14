"use client";

import { useBookings } from "@/hooks/useBookings";

export default function FinancePage() {
  const { stats } = useBookings();

  return (
    <div className="p-8">
      <h1 className="font-serif text-4xl font-light tracking-tighter text-black">Finance</h1>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Revenue and transaction breakdown</p>
      
      <div className="mt-12 grid gap-8">
        <div className="border-[0.5px] border-zinc-200 bg-white p-12 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Total Gross Revenue</p>
          <h2 className="text-6xl font-bold tracking-tighter text-black">RM {stats.revenue.toLocaleString()}</h2>
        </div>
      </div>
    </div>
  );
}
