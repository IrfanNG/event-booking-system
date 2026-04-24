"use client";

import { use } from "react";
import { VenueForm } from "@/components/admin/VenueForm";
import { useVenues } from "@/hooks/useVenues";
import { Loader2 } from "lucide-react";

export default function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { venues, updateVenue, loading } = useVenues({ includeArchived: true });

  const venue = venues.find((v) => v.id === id);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Venue not found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <VenueForm 
        title="Edit Space Details" 
        initialData={venue}
        onSubmit={(data) => updateVenue(id, data)} 
      />
    </div>
  );
}
