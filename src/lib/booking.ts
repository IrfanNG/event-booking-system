import type { Timestamp } from "firebase/firestore";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { normalizeEmail, normalizePhone } from "@/lib/contactNormalization";

export const BOOKING_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_TIME_SLOTS = ["full", "morning", "evening", "custom"] as const;
export type BookingTimeSlot = (typeof BOOKING_TIME_SLOTS)[number];

export const BOOKING_DAY_SLOTS = ["full", "morning", "evening"] as const;
export type BookingSlot = (typeof BOOKING_DAY_SLOTS)[number];

export const BOOKING_DEFAULT_CURRENCY = "MYR";
export const BOOKING_SERVICE_FEE_RATE = 0.1;

type DateWithSeconds = { seconds: number };
type DateWithToDate = { toDate: () => Date };

export type NormalizableDate =
  | Timestamp
  | Date
  | string
  | number
  | DateWithSeconds
  | DateWithToDate
  | null
  | undefined;

export type BookingCustomerIdentity = {
  name: string;
  email: string;
  phone: string;
  normalizedName: string;
  normalizedEmail: string;
  normalizedPhone: string;
};

export type BookingPricingBreakdown = {
  currency: string;
  baseAmount: number;
  serviceFeeAmount: number;
  depositAmount: number;
  refundAmount: number;
  totalAmount: number;
};

export type BookingLifecycle = {
  status: BookingStatus;
  createdAt?: NormalizableDate;
  updatedAt?: NormalizableDate;
  approvedAt?: NormalizableDate;
  rejectedAt?: NormalizableDate;
  cancelledAt?: NormalizableDate;
  statusUpdatedAt?: NormalizableDate;
  cancelledBy?: "customer" | "admin";
  cancelReason?: string;
  rescheduledFromBookingId?: string;
  replacementBookingId?: string;
};

export type BookingReservation = {
  startDate: NormalizableDate;
  endDate?: NormalizableDate;
  dayCount: number;
  timeSlot: BookingTimeSlot;
  dailySchedule: Record<string, BookingSlot>;
};

export type BookingRecord = {
  id: string;
  referenceId: string;
  venueId: string;
  venueName: string;
  guests: number;
  customer: BookingCustomerIdentity;
  reservation: BookingReservation;
  pricing: BookingPricingBreakdown;
  lifecycle: BookingLifecycle;
  date: NormalizableDate;
  endDate?: NormalizableDate;
  days: number;
  dailySchedule: Record<string, BookingSlot>;
  timeSlot: BookingTimeSlot;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt?: NormalizableDate;
  updatedAt?: NormalizableDate;
  approvedAt?: NormalizableDate;
  rejectedAt?: NormalizableDate;
  cancelledAt?: NormalizableDate;
  statusUpdatedAt?: NormalizableDate;
};

export type Booking = BookingRecord;
export type BookingDocument = Omit<BookingRecord, "id">;

export type CreateBookingPayload = {
  referenceId?: string;
  venueId: string;
  venueName?: string;
  guests: number;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  reservation?: {
    startDate: string;
    endDate?: string | null;
    dayCount: number;
    timeSlot: BookingTimeSlot;
    dailySchedule: Record<string, BookingSlot>;
  };
  pricing?: Partial<BookingPricingBreakdown>;
  status?: BookingStatus;
  date?: string;
  endDate?: string | null;
  days?: number;
  dailySchedule?: Record<string, BookingSlot>;
  timeSlot?: BookingTimeSlot;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  totalPrice?: number;
  currency?: string;
  website?: string;
};

export type CreateBookingResponse =
  | {
      ok: true;
      bookingId: string;
      referenceId: string;
      notificationStatus?: "sent" | "skipped" | "failed";
      notificationReason?: string;
    }
  | { ok: false; error: string; code?: "SLOT_CONFLICT" | "BOOKING_RATE_LIMIT" | "BOT_DETECTED" };

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeName = (value: unknown) => normalizeText(value).replace(/\s+/g, " ");

const isValidDaySlot = (value: unknown): value is BookingSlot =>
  typeof value === "string" && (BOOKING_DAY_SLOTS as readonly string[]).includes(value);

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildDailySchedule = (start: Date | null, end: Date | null, slot: BookingSlot) => {
  if (!start) return {};

  const lastDay = end ?? start;
  if (lastDay < start) return {};

  return eachDayOfInterval({ start, end: lastDay }).reduce<Record<string, BookingSlot>>((acc, day) => {
    acc[format(day, "yyyy-MM-dd")] = slot;
    return acc;
  }, {});
};

const getCustomerInput = (payload: CreateBookingPayload) => {
  const name = normalizeName(payload.customer?.name ?? payload.customerName);
  const email = normalizeText(payload.customer?.email ?? payload.customerEmail);
  const phone = normalizeText(payload.customer?.phone ?? payload.customerPhone);

  return {
    name,
    email,
    phone,
    normalizedName: name.toLowerCase(),
    normalizedEmail: normalizeEmail(email),
    normalizedPhone: normalizePhone(phone),
  };
};

const getReservationInput = (payload: CreateBookingPayload) => {
  const reservation = payload.reservation;
  const startDate = reservation?.startDate ?? payload.date ?? "";
  const endDate = reservation?.endDate ?? payload.endDate ?? null;
  const dayCount = reservation?.dayCount ?? payload.days ?? 1;
  const timeSlot = reservation?.timeSlot ?? payload.timeSlot ?? "full";

  const start = toDate(startDate);
  const end = toDate(endDate);
  const providedSchedule = reservation?.dailySchedule ?? payload.dailySchedule ?? {};
  const dailySchedule = Object.entries(providedSchedule).reduce<Record<string, BookingSlot>>((acc, [dayKey, slot]) => {
    if (isValidDaySlot(slot)) {
      acc[dayKey] = slot;
    }
    return acc;
  }, {});

  return {
    startDate: start ?? startDate,
    endDate: end ?? undefined,
    dayCount: Math.max(1, dayCount),
    timeSlot,
    dailySchedule: Object.keys(dailySchedule).length > 0 ? dailySchedule : buildDailySchedule(start, end, timeSlot === "custom" ? "full" : timeSlot),
  };
};

const getPricingInput = (payload: CreateBookingPayload, baseAmount: number) => {
  const serviceFeeAmount = payload.pricing?.serviceFeeAmount ?? baseAmount * BOOKING_SERVICE_FEE_RATE;
  const depositAmount = payload.pricing?.depositAmount ?? 0;
  const refundAmount = payload.pricing?.refundAmount ?? 0;
  const totalAmount = payload.pricing?.totalAmount ?? payload.totalPrice ?? baseAmount + serviceFeeAmount + depositAmount - refundAmount;

  return {
    currency: payload.pricing?.currency ?? payload.currency ?? BOOKING_DEFAULT_CURRENCY,
    baseAmount,
    serviceFeeAmount,
    depositAmount,
    refundAmount,
    totalAmount,
  };
};

export function buildBookingDocument(
  payload: CreateBookingPayload,
  options: {
    venueId: string;
    venueName: string;
    venuePrice: number;
    referenceId: string;
    status?: BookingStatus;
    createdAt?: Date;
  }
): BookingDocument {
  const customer = getCustomerInput(payload);
  const reservation = getReservationInput(payload);
  const baseAmount = reservation.dailySchedule && Object.keys(reservation.dailySchedule).length > 0
    ? Object.entries(reservation.dailySchedule).reduce((total, [, slot]) => total + options.venuePrice * (slot === "full" ? 1 : 0.6), 0)
    : options.venuePrice * reservation.dayCount;
  const pricing = getPricingInput(payload, baseAmount);
  const now = options.createdAt ?? new Date();
  const status = options.status ?? payload.status ?? "pending";

  return {
    referenceId: options.referenceId,
    venueId: options.venueId,
    venueName: options.venueName,
    guests: payload.guests,
    customer,
    reservation,
    pricing,
    lifecycle: {
      status,
      createdAt: now,
      updatedAt: now,
      statusUpdatedAt: now,
    },
    date: reservation.startDate,
    endDate: reservation.endDate,
    days: reservation.dayCount,
    dailySchedule: reservation.dailySchedule,
    timeSlot: reservation.timeSlot,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    totalPrice: pricing.totalAmount,
    status,
    createdAt: now,
    updatedAt: now,
    statusUpdatedAt: now,
  };
}
