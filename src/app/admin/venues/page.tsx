"use client";

import { motion } from "framer-motion";
import { useVenues } from "@/hooks/useVenues";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default function AdminVenues() {
  const { venues, loading, deleteVenue } = useVenues();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this venue? This action cannot be undone.")) {
      await deleteVenue(id);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl font-light tracking-tighter text-black">Venue Management</h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Curate and manage your spaces.</p>
        </div>
        <Link 
          href="/admin/venues/new"
          className="flex items-center gap-2 bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 shadow-lg shadow-zinc-200"
        >
          <Plus className="h-4 w-4" />
          Add New Venue
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
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Venue</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Category</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Capacity</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Price (RM)</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-[0.5px] divide-zinc-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-[10px] font-bold uppercase text-zinc-300 tracking-widest">Syncing Spaces...</td></tr>
            ) : venues.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-[10px] font-bold uppercase text-zinc-300 tracking-widest">No venues curated yet.</td></tr>
            ) : venues.map((v) => (
              <tr key={v.id} className="group hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-zinc-100 border-[0.5px] border-zinc-200 overflow-hidden shrink-0">
                      <img src={v.image} alt={v.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black uppercase tracking-tight">{v.name}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{v.location}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{v.category}</span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-black">{v.capacity} pax</td>
                <td className="px-6 py-4 text-xs font-bold text-black">RM {v.price.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link 
                      href={`/admin/venues/${v.id}/edit`}
                      className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(v.id)}
                      className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
