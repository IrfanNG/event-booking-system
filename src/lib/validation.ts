import { z } from "zod";

export const BOOKING_DAY_SLOTS = ["full", "morning", "evening"] as const;
export const BOOKING_TIME_SLOTS = ["full", "morning", "evening", "custom"] as const;

export const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(8, "Phone number must be at least 8 digits."),
});

export const bookingSlotSchema = z.enum(BOOKING_DAY_SLOTS);
export const bookingTimeSlotSchema = z.enum(BOOKING_TIME_SLOTS);

export const createBookingSchema = z.object({
  venueId: z.string().min(1, "Venue ID is required."),
  guests: z.number().min(1, "Guest count must be at least 1."),

  // Flat fields (legacy support)
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  date: z.string().optional(),
  endDate: z.string().optional().nullable(),
  days: z.number().optional(),
  timeSlot: bookingTimeSlotSchema.optional(),
  dailySchedule: z.record(z.string(), bookingSlotSchema).optional(),

  // Nested structures (preferred)
  customer: customerSchema.optional(),
  reservation: z.object({
    startDate: z.string(),
    endDate: z.string().optional().nullable(),
    dayCount: z.number(),
    timeSlot: bookingTimeSlotSchema,
    dailySchedule: z.record(z.string(), bookingSlotSchema),
  }).optional(),

  pricing: z.object({
    currency: z.string().optional(),
    totalPrice: z.number().optional(),
  }).optional(),

  website: z.string().optional(), // Honeypot
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

