import type { BookingPricingBreakdown } from "@/lib/booking";

type BookingFinanceSource = {
  pricing?: Partial<BookingPricingBreakdown> | null;
  totalPrice?: unknown;
};

export type BookingFinanceSummary = {
  currency: string;
  baseAmount: number;
  serviceFeeAmount: number;
  depositAmount: number;
  refundAmount: number;
  grossAmount: number;
  netAmount: number;
};

const toFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const roundMoney = (value: number) => Number(value.toFixed(2));

export function resolveBookingFinance(source: BookingFinanceSource): BookingFinanceSummary {
  const pricing = source.pricing ?? {};
  const currency = typeof pricing.currency === "string" && pricing.currency.trim() ? pricing.currency : "MYR";
  const totalPrice = toFiniteNumber(source.totalPrice) ?? 0;
  const serviceFeeAmount = toFiniteNumber(pricing.serviceFeeAmount) ?? 0;
  const depositAmount = toFiniteNumber(pricing.depositAmount) ?? 0;
  const refundAmount = toFiniteNumber(pricing.refundAmount) ?? 0;
  const computedNetAmount = totalPrice > 0 ? totalPrice : 0;
  const totalAmount = toFiniteNumber(pricing.totalAmount) ?? computedNetAmount;
  const inferredBaseAmount =
    toFiniteNumber(pricing.baseAmount) ??
    Math.max(0, totalAmount - serviceFeeAmount - depositAmount + refundAmount);
  const grossAmount = inferredBaseAmount + serviceFeeAmount;
  const netAmount = totalAmount > 0 ? totalAmount : roundMoney(grossAmount + depositAmount - refundAmount);

  return {
    currency,
    baseAmount: roundMoney(inferredBaseAmount),
    serviceFeeAmount: roundMoney(serviceFeeAmount),
    depositAmount: roundMoney(depositAmount),
    refundAmount: roundMoney(refundAmount),
    grossAmount: roundMoney(grossAmount),
    netAmount: roundMoney(netAmount),
  };
}

export function formatMoney(amount: number, currency = "MYR") {
  const prefix = currency === "MYR" ? "RM" : currency;
  return `${prefix} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
