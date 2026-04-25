import { format, eachDayOfInterval } from "date-fns";
import {
  BOOKING_DEFAULT_CURRENCY,
  BOOKING_DAY_SLOTS,
  BOOKING_STATUSES,
  BOOKING_TIME_SLOTS,
  type Booking,
  type BookingCustomerIdentity,
  type BookingLifecycle,
  type BookingPricingBreakdown,
  type BookingRecord,
  type BookingReservation,
  type BookingSlot,
  type BookingStatus,
  type BookingTimeSlot,
  type NormalizableDate,
} from "@/lib/booking";
import { resolveBookingFinance } from "@/lib/finance";

type DateWithSeconds = { seconds: number };
type DateWithToDate = { toDate: () => Date };

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeName = (value: unknown) => normalizeText(value).replace(/\s+/g, " ");

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object";

const isValidDate = (value: Date) => !Number.isNaN(value.getTime());

const isValidDaySlot = (value: unknown): value is BookingSlot =>
  typeof value === "string" && (BOOKING_DAY_SLOTS as readonly string[]).includes(value);

const isValidTimeSlot = (value: unknown): value is BookingTimeSlot =>
  typeof value === "string" && (BOOKING_TIME_SLOTS as readonly string[]).includes(value);

export function normalizeDate(value: NormalizableDate): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (typeof value === "object" && value && "toDate" in value && typeof (value as DateWithToDate).toDate === "function") {
    const parsed = (value as DateWithToDate).toDate();
    return isValidDate(parsed) ? parsed : null;
  }

  if (typeof value === "object" && value && "seconds" in value && typeof (value as DateWithSeconds).seconds === "number") {
    const parsed = new Date((value as DateWithSeconds).seconds * 1000);
    return isValidDate(parsed) ? parsed : null;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return isValidDate(parsed) ? parsed : null;
  }

  return null;
}

export function toEpochMs(value: NormalizableDate): number {
  return normalizeDate(value)?.getTime() ?? 0;
}

export function normalizeBookingStatus(status: unknown): BookingStatus {
  if (typeof status === "string" && BOOKING_STATUSES.includes(status as BookingStatus)) {
    return status as BookingStatus;
  }

  return "pending";
}

export function isInactiveBookingStatus(status: unknown): boolean {
  return ["rejected", "cancelled"].includes(normalizeBookingStatus(status));
}

const normalizeDailySchedule = (
  value: unknown,
  startDate: Date | null,
  endDate: Date | null,
  fallbackSlot: BookingSlot
): Record<string, BookingSlot> => {
  const schedule: Record<string, BookingSlot> = {};

  if (isObject(value)) {
    for (const [dayKey, slot] of Object.entries(value)) {
      if (isValidDaySlot(slot)) {
        schedule[dayKey] = slot;
      }
    }
  }

  if (Object.keys(schedule).length > 0) {
    return schedule;
  }

  if (!startDate) {
    return schedule;
  }

  const lastDay = endDate ?? startDate;
  if (lastDay < startDate) {
    return schedule;
  }

  return eachDayOfInterval({ start: startDate, end: lastDay }).reduce<Record<string, BookingSlot>>((acc, day) => {
    acc[format(day, "yyyy-MM-dd")] = fallbackSlot;
    return acc;
  }, {});
};

const normalizeReservation = (booking: BookingRecord | Record<string, unknown>): BookingReservation => {
  const reservation = isObject(booking.reservation) ? booking.reservation : {};
  const startDate = normalizeDate((reservation.startDate ?? booking.date) as NormalizableDate);
  const endDate = normalizeDate((reservation.endDate ?? booking.endDate) as NormalizableDate);
  const timeSlot = isValidTimeSlot(reservation.timeSlot) ? reservation.timeSlot : isValidTimeSlot(booking.timeSlot) ? booking.timeSlot : "full";
  const schedule = normalizeDailySchedule(reservation.dailySchedule ?? booking.dailySchedule, startDate, endDate, timeSlot === "custom" ? "full" : timeSlot);
  const dayCount =
    typeof reservation.dayCount === "number" && reservation.dayCount > 0
      ? reservation.dayCount
      : typeof booking.days === "number" && booking.days > 0
        ? booking.days
        : Object.keys(schedule).length > 0
          ? Object.keys(schedule).length
          : 1;

  return {
    startDate: startDate ?? (booking.date as NormalizableDate),
    endDate: endDate ?? (booking.endDate as NormalizableDate),
    dayCount,
    timeSlot,
    dailySchedule: schedule,
  };
};

const normalizeCustomer = (booking: BookingRecord | Record<string, unknown>): BookingCustomerIdentity => {
  const customer = isObject(booking.customer) ? booking.customer : {};
  const name = normalizeName(customer.name ?? booking.customerName);
  const email = normalizeText(customer.email ?? booking.customerEmail);
  const phone = normalizeText(customer.phone ?? booking.customerPhone);

  return {
    name,
    email,
    phone,
    normalizedName: normalizeName(customer.normalizedName ?? name).toLowerCase(),
    normalizedEmail: normalizeText(customer.normalizedEmail ?? email).toLowerCase(),
    normalizedPhone: normalizeText(customer.normalizedPhone ?? phone).replace(/\D/g, ""),
  };
};

const normalizePricing = (booking: BookingRecord | Record<string, unknown>): BookingPricingBreakdown => {
  const pricing = isObject(booking.pricing) ? booking.pricing : {};
  const finance = resolveBookingFinance({
    pricing: {
      currency: typeof pricing.currency === "string" ? pricing.currency : BOOKING_DEFAULT_CURRENCY,
      baseAmount: typeof pricing.baseAmount === "number" && Number.isFinite(pricing.baseAmount) ? pricing.baseAmount : undefined,
      serviceFeeAmount: typeof pricing.serviceFeeAmount === "number" && Number.isFinite(pricing.serviceFeeAmount) ? pricing.serviceFeeAmount : undefined,
      depositAmount: typeof pricing.depositAmount === "number" && Number.isFinite(pricing.depositAmount) ? pricing.depositAmount : undefined,
      refundAmount: typeof pricing.refundAmount === "number" && Number.isFinite(pricing.refundAmount) ? pricing.refundAmount : undefined,
      totalAmount: typeof pricing.totalAmount === "number" && Number.isFinite(pricing.totalAmount) ? pricing.totalAmount : undefined,
    },
    totalPrice: typeof booking.totalPrice === "number" && Number.isFinite(booking.totalPrice) ? booking.totalPrice : undefined,
  });

  return {
    currency: finance.currency,
    baseAmount: finance.baseAmount,
    serviceFeeAmount: finance.serviceFeeAmount,
    depositAmount: finance.depositAmount,
    refundAmount: finance.refundAmount,
    totalAmount: finance.netAmount,
  };
};

const normalizeLifecycle = (booking: BookingRecord | Record<string, unknown>): BookingLifecycle => {
  const lifecycle = isObject(booking.lifecycle) ? booking.lifecycle : {};
  const status = normalizeBookingStatus(lifecycle.status ?? booking.status);

  return {
    status,
    createdAt: (lifecycle.createdAt ?? booking.createdAt) as NormalizableDate,
    updatedAt: (lifecycle.updatedAt ?? booking.updatedAt) as NormalizableDate,
    approvedAt: (lifecycle.approvedAt ?? booking.approvedAt) as NormalizableDate,
    rejectedAt: (lifecycle.rejectedAt ?? booking.rejectedAt) as NormalizableDate,
    cancelledAt: (lifecycle.cancelledAt ?? booking.cancelledAt) as NormalizableDate,
    statusUpdatedAt: (lifecycle.statusUpdatedAt ?? booking.statusUpdatedAt) as NormalizableDate,
    cancelledBy: lifecycle.cancelledBy === "customer" || lifecycle.cancelledBy === "admin" ? lifecycle.cancelledBy : undefined,
    cancelReason: typeof lifecycle.cancelReason === "string" ? lifecycle.cancelReason : undefined,
    rescheduledFromBookingId: typeof lifecycle.rescheduledFromBookingId === "string" ? lifecycle.rescheduledFromBookingId : undefined,
    replacementBookingId: typeof lifecycle.replacementBookingId === "string" ? lifecycle.replacementBookingId : undefined,
  };
};

export function normalizeBookingRecord(booking: BookingRecord | Record<string, unknown>): Booking {
  const customer = normalizeCustomer(booking);
  const reservation = normalizeReservation(booking);
  const pricing = normalizePricing(booking);
  const lifecycle = normalizeLifecycle(booking);
  const status = lifecycle.status;
  const totalPrice = pricing.totalAmount;
  const referenceId = typeof booking.referenceId === "string" ? booking.referenceId : "";
  const venueId = typeof booking.venueId === "string" ? booking.venueId : "";
  const venueName = typeof booking.venueName === "string" ? booking.venueName : "";
  const guests = typeof booking.guests === "number" && Number.isFinite(booking.guests) ? booking.guests : 0;

  return {
    id: typeof booking.id === "string" ? booking.id : "",
    referenceId,
    venueId,
    venueName,
    guests,
    customer,
    reservation,
    pricing,
    lifecycle,
    date: reservation.startDate,
    endDate: reservation.endDate,
    days: reservation.dayCount,
    dailySchedule: reservation.dailySchedule,
    timeSlot: reservation.timeSlot,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    totalPrice,
    status,
    createdAt: lifecycle.createdAt,
    updatedAt: lifecycle.updatedAt,
    approvedAt: lifecycle.approvedAt,
    rejectedAt: lifecycle.rejectedAt,
    cancelledAt: lifecycle.cancelledAt,
    statusUpdatedAt: lifecycle.statusUpdatedAt,
  };
}

export function getBookingStatus(booking: { status?: unknown; lifecycle?: { status?: unknown } }): BookingStatus {
  return normalizeBookingStatus(booking.lifecycle?.status ?? booking.status);
}

export function isRejectedBookingStatus(status: unknown): boolean {
  if (isObject(status)) {
    const s = status as any;
    return normalizeBookingStatus(s.lifecycle?.status ?? s.status) === "rejected";
  }

  return normalizeBookingStatus(status) === "rejected";
}
