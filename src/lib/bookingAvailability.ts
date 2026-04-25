import { isSameDay, format } from "date-fns";
import { normalizeDate } from "@/lib/bookingNormalization";
import type { BookingSlot, NormalizableDate } from "@/lib/booking";

export const ACTIVE_BOOKING_STATUSES = ["pending", "approved"] as const;

export type ExistingBookingShape = {
  date?: unknown;
  timeSlot?: unknown;
  dailySchedule?: unknown;
  reservation?: {
    startDate?: unknown;
    endDate?: unknown;
    timeSlot?: unknown;
    dailySchedule?: unknown;
  };
};

export function hasCollision(existingSlots: BookingSlot[], requestedSlot: BookingSlot) {
  if (existingSlots.includes("full")) return true;
  if (requestedSlot === "full" && existingSlots.length > 0) return true;
  return existingSlots.includes(requestedSlot);
}

export function getExistingSlotsForDay(data: ExistingBookingShape, requestDay: Date): BookingSlot[] {
  const slots: BookingSlot[] = [];
  const dayKey = format(requestDay, "yyyy-MM-dd");

  if (data.reservation && typeof data.reservation === "object") {
    const reservation = data.reservation as Record<string, unknown>;
    if (reservation.dailySchedule && typeof reservation.dailySchedule === "object") {
      const schedule = reservation.dailySchedule as Record<string, unknown>;
      const slot = schedule[dayKey];
      if (slot === "full" || slot === "morning" || slot === "evening") {
        slots.push(slot);
      }
    }
    if (slots.length > 0) return slots;
  }

  if (data.dailySchedule && typeof data.dailySchedule === "object") {
    const schedule = data.dailySchedule as Record<string, unknown>;
    const slot = schedule[dayKey];
    if (slot === "full" || slot === "morning" || slot === "evening") {
      slots.push(slot);
    }
  }

  if (slots.length > 0) return slots;

  const existingDate = normalizeDate(data.date as NormalizableDate);
  if (!existingDate || !isSameDay(existingDate, requestDay)) return slots;

  if (data.timeSlot === "full" || data.timeSlot === "morning" || data.timeSlot === "evening") {
    slots.push(data.timeSlot as BookingSlot);
  } else if (data.timeSlot === "custom") {
    slots.push("full");
  }

  return slots;
}

