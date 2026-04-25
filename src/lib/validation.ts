import { z } from "zod";

export const BOOKING_DAY_SLOTS = ["full", "morning", "evening"] as const;
export const BOOKING_TIME_SLOTS = ["full", "morning", "evening", "custom"] as const;

export const customerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number is too short"),
});

export const bookingSlotSchema = z.enum(BOOKING_DAY_SLOTS);
export const bookingTimeSlotSchema = z.enum(BOOKING_TIME_SLOTS);

export const createBookingSchema = z.object({
  venueId: z.string().min(1, "Venue ID is required"),
  guests: z.number().min(1, "Guest count must be at least 1"),
  
  // Flat fields (compatibility)
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  date: z.string().optional(),
  endDate: z.string().optional().nullable(),
  days: z.number().optional(),
  timeSlot: bookingTimeSlotSchema.optional(),
  dailySchedule: z.record(bookingSlotSchema).optional(),
  
  // Nested structures (preferred)
  customer: customerSchema.optional(),
  reservation: z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional().nullable(),
    dayCount: z.number().min(1),
    timeSlot: bookingTimeSlotSchema,
    dailySchedule: z.record(bookingSlotSchema),
  }).optional(),
  
  pricing: z.object({
    currency: z.string().optional(),
    totalPrice: z.number().optional(),
  }).optional(),
  
  website: z.string().optional(), // Honeypot
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
