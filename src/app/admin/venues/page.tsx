"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVenues } from "@/hooks/useVenues";
import { Plus, Edit, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminVenues() {
  const { venues, loading, deleteVenue } = useVenues();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const venueToDelete = venues.find(v => v.id === deleteTarget);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await deleteVenue(deleteTarget);
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="p-8">
      {/* Custom Delete Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-white border-[0.5px] border-zinc-200 shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 text-red-600 mb-6">
                  <div className="bg-red-50 p-3">
                    <AlertTriangle size={20} />
                  </div>
                  <h2 className="font-serif text-2xl tracking-tighter text-black">Confirm Deletion</h2>
                </div>
                
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Are you sure you want to remove <span className="font-bold text-black uppercase">{venueToDelete?.name}</span>? 
                  This action is permanent and will remove all associated booking data for this venue.
                </p>

                <div className="mt-10 flex gap-3">
                  <button 
                    onClick={() => setDeleteTarget(null)}
                    disabled={isDeleting}
                    className="flex-1 border-[0.5px] border-zinc-200 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 text-white py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete Venue
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
                      onClick={() => setDeleteTarget(v.id)}
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
