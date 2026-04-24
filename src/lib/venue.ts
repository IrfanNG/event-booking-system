import type { Venue } from "@/lib/mockData";

export function isArchivedVenue(venue: Pick<Venue, "isArchived"> | null | undefined): boolean {
  return venue?.isArchived === true;
}

