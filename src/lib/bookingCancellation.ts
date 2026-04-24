import { differenceInCalendarDays, startOfDay } from "date-fns";
import { normalizeDate } from "@/lib/bookingNormalization";
import { resolveBookingFinance } from "@/lib/finance";
import type { Booking } from "@/lib/booking";

export const CANCEL_NOTICE_DAYS = 7;
export const FULL_REFUND_NOTICE_DAYS = 14;

const roundMoney = (value: number) => Number(value.toFixed(2));

type CancellationSource = Pick<Booking, "date" | "endDate" | "reservation" | "pricing" | "totalPrice">;

export type CancellationQuote = {
  daysUntilStart: number;
  refundableBaseAmount: number;
  refundableServiceFeeAmount: number;
  refundableDepositAmount: number;
  refundAmount: number;
  retainedAmount: number;
};

export function getBookingStartDate(source: CancellationSource): Date | null {
  return normalizeDate(source.reservation?.startDate ?? source.date);
}

export function getDaysUntilBookingStart(source: CancellationSource, now = new Date()) {
  const startDate = getBookingStartDate(source);
  if (!startDate) return null;

  return differenceInCalendarDays(startOfDay(startDate), startOfDay(now));
}

export function canCancelBooking(source: CancellationSource, now = new Date()): boolean {
  const daysUntilStart = getDaysUntilBookingStart(source, now);
  return daysUntilStart !== null && daysUntilStart > 0;
}

export function canRescheduleBooking(source: CancellationSource, now = new Date()): boolean {
  const daysUntilStart = getDaysUntilBookingStart(source, now);
  return daysUntilStart !== null && daysUntilStart >= CANCEL_NOTICE_DAYS;
}

export function calculateCancellationQuote(source: CancellationSource, now = new Date()): CancellationQuote | null {
  const daysUntilStart = getDaysUntilBookingStart(source, now);
  if (daysUntilStart === null) return null;

  const finance = resolveBookingFinance(source);
  let refundableBaseAmount = 0;
  let refundableDepositAmount = 0;

  if (daysUntilStart >= FULL_REFUND_NOTICE_DAYS) {
    refundableBaseAmount = finance.baseAmount;
    refundableDepositAmount = finance.depositAmount;
  } else if (daysUntilStart >= CANCEL_NOTICE_DAYS) {
    refundableBaseAmount = finance.baseAmount * 0.5;
    refundableDepositAmount = finance.depositAmount;
  } else {
    refundableBaseAmount = 0;
    refundableDepositAmount = finance.depositAmount;
  }

  const refundableServiceFeeAmount = finance.serviceFeeAmount;
  const refundAmount = roundMoney(refundableBaseAmount + refundableServiceFeeAmount + refundableDepositAmount);
  const retainedAmount = roundMoney(Math.max(0, finance.grossAmount + finance.depositAmount - refundAmount));

  return {
    daysUntilStart,
    refundableBaseAmount: roundMoney(refundableBaseAmount),
    refundableServiceFeeAmount: roundMoney(refundableServiceFeeAmount),
    refundableDepositAmount: roundMoney(refundableDepositAmount),
    refundAmount,
    retainedAmount,
  };
}
