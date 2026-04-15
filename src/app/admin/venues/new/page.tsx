"use client";

import { VenueForm } from "@/components/admin/VenueForm";
import { useVenues } from "@/hooks/useVenues";

export default function NewVenuePage() {
  const { addVenue } = useVenues();

  return (
    <div className="bg-white min-h-screen">
      <VenueForm 
        title="Curate New Space" 
        onSubmit={addVenue} 
      />
    </div>
  );
}
