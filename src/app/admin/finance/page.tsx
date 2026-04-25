"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wallet, TrendingUp, Clock, CreditCard, ArrowUpRight, BarChart3, X } from "lucide-react";
import { format } from "date-fns";
import { useBookings } from "@/hooks/useBookings";
import { Booking } from "@/lib/mockData";
import { getBookingStatus, normalizeDate } from "@/lib/bookingNormalization";
import { formatMoney, resolveBookingFinance, type BookingFinanceSummary } from "@/lib/finance";
import { useAdminSearch } from "@/context/AdminSearchContext";
import { matchesAdminSearch } from "@/lib/adminSearch";

type LedgerRow = {
  booking: Booking;
  finance: BookingFinanceSummary;
  bookingDate: Date | null;
  status: Booking["status"];
  balanceDue: number;
  paymentLabel: string;
  paymentHint: string;
  tone: "neutral" | "success" | "warning" | "danger" | "info";
};

export default function FinancePage() {
  const { bookings, loading } = useBookings();
  const { searchTerm } = useAdminSearch();
  const [selectedRow, setSelectedRow] = useState<LedgerRow | null>(null);

  const visibleBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const finance = resolveBookingFinance(booking);
      const bookingDate = normalizeDate(booking.date);
      const status = getBookingStatus(booking);
      const balanceDue = Math.max(0, finance.grossAmount - finance.depositAmount - finance.refundAmount);

      return matchesAdminSearch(searchTerm, [
        booking.referenceId,
        booking.customerName,
        booking.customerEmail,
        booking.customerPhone,
        booking.venueName,
        status,
        bookingDate ? format(bookingDate, "PPP") : null,
        finance.grossAmount,
        finance.depositAmount,
        finance.refundAmount,
        finance.netAmount,
        balanceDue
      ]);
    });
  }, [bookings, searchTerm]);

  const approvedBookings = useMemo(
    () => visibleBookings.filter((booking) => getBookingStatus(booking) === "approved"),
    [visibleBookings]
  );
  const activeBookings = useMemo(
    () => visibleBookings.filter((booking) => ["pending", "approved"].includes(getBookingStatus(booking))),
    [visibleBookings]
  );
  const closedBookings = useMemo(
    () => visibleBookings.filter((booking) => ["rejected", "cancelled"].includes(getBookingStatus(booking))),
    [visibleBookings]
  );

  const grossRevenue = useMemo(
    () => approvedBookings.reduce((sum, booking) => sum + resolveBookingFinance(booking).grossAmount, 0),
    [approvedBookings]
  );
  const netRevenue = useMemo(
    () => approvedBookings.reduce((sum, booking) => sum + resolveBookingFinance(booking).netAmount, 0),
    [approvedBookings]
  );
  const depositsHeld = useMemo(
    () => activeBookings.reduce((sum, booking) => sum + resolveBookingFinance(booking).depositAmount, 0),
    [activeBookings]
  );
  const refundsIssued = useMemo(
    () => closedBookings.reduce((sum, booking) => sum + resolveBookingFinance(booking).refundAmount, 0),
    [closedBookings]
  );
  const outstandingBalance = useMemo(
    () =>
      activeBookings.reduce((sum, booking) => {
        const finance = resolveBookingFinance(booking);
        return sum + Math.max(0, finance.grossAmount - finance.depositAmount - finance.refundAmount);
      }, 0),
    [activeBookings]
  );
  const avgBookingValue = approvedBookings.length > 0 ? netRevenue / approvedBookings.length : 0;
  const approvalRate = visibleBookings.length > 0 ? (approvedBookings.length / visibleBookings.length) * 100 : 0;
  const depositCoverage = grossRevenue > 0 ? (depositsHeld / grossRevenue) * 100 : 0;
  const settlementCoverage = grossRevenue > 0 ? Math.max(0, ((grossRevenue - outstandingBalance) / grossRevenue) * 100) : 0;

  const ledgerRows = useMemo<LedgerRow[]>(() => {
    return visibleBookings.map((booking) => {
      const finance = resolveBookingFinance(booking);
      const bookingDate = normalizeDate(booking.date);
      const status = getBookingStatus(booking);
      const balanceDue = Math.max(0, finance.grossAmount - finance.depositAmount - finance.refundAmount);
      const { paymentLabel, paymentHint, tone } = getPaymentState(booking, finance, balanceDue);

      return {
        booking,
        finance,
        bookingDate,
        status,
        balanceDue,
        paymentLabel,
        paymentHint,
        tone
      };
    });
  }, [visibleBookings]);

  const monthlyCashflow = useMemo(() => {
    const monthMap = new Map<
      string,
      {
        key: string;
        label: string;
        gross: number;
        net: number;
        deposits: number;
        refunds: number;
        bookings: number;
      }
    >();

    visibleBookings.forEach((booking) => {
      const bookingDate = normalizeDate(booking.date);
      if (!bookingDate) return;

      const finance = resolveBookingFinance(booking);
      const status = getBookingStatus(booking);
      const key = format(bookingDate, "yyyy-MM");
      const label = format(bookingDate, "MMM yyyy");
      const current =
        monthMap.get(key) ?? {
          key,
          label,
          gross: 0,
          net: 0,
          deposits: 0,
          refunds: 0,
          bookings: 0
        };

      if (status === "approved") {
        current.gross += finance.grossAmount;
        current.net += finance.netAmount;
        current.deposits += finance.depositAmount;
      } else if (status === "pending") {
        current.deposits += finance.depositAmount;
      } else {
        current.refunds += finance.refundAmount;
      }

      current.bookings += 1;
      monthMap.set(key, current);
    });

    return Array.from(monthMap.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6);
  }, [visibleBookings]);

  const venuePerformance = useMemo(() => {
    const perfMap = new Map<string, { name: string; revenue: number; count: number }>();

    approvedBookings.forEach((booking) => {
      const finance = resolveBookingFinance(booking);
      const name = booking.venueName || "Default Venue";

      if (!perfMap.has(name)) {
        perfMap.set(name, { name, revenue: 0, count: 0 });
      }

      const entry = perfMap.get(name);
      if (!entry) return;

      entry.revenue += finance.grossAmount;
      entry.count += 1;
    });

    return Array.from(perfMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [approvedBookings]);

  const handleExportCsv = () => {
    if (ledgerRows.length === 0) return;

    const escapeCsv = (value: string | number) => {
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, "\"\"")}"`;
      }
      return stringValue;
    };

    const header = [
      "Ref ID",
      "Date",
      "Recipient",
      "Venue",
      "Status",
      "Gross (RM)",
      "Deposit (RM)",
      "Refund (RM)",
      "Balance Due (RM)",
      "Net (RM)"
    ];

    const rows = ledgerRows.map((row) => [
      row.booking.referenceId ?? "",
      row.bookingDate ? format(row.bookingDate, "yyyy-MM-dd") : "",
      row.booking.customerName ?? "",
      row.booking.venueName ?? "",
      row.status,
      row.finance.grossAmount,
      row.finance.depositAmount,
      row.finance.refundAmount,
      row.balanceDue,
      row.finance.netAmount
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-ledger-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="font-serif text-4xl font-light tracking-tighter text-black">Financial Operations</h1>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Cashflow, collections, and ledger visibility</p>
      </div>

      <div className="mb-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Gross Booking Value"
          value={formatMoney(grossRevenue)}
          icon={<Wallet className="h-4 w-4 text-black" />}
          note="Approved venue + service fees"
        />
        <MetricCard
          label="Net Revenue"
          value={formatMoney(netRevenue)}
          icon={<TrendingUp className="h-4 w-4 text-black" />}
          note={`${approvalRate.toFixed(0)}% approval rate`}
        />
        <MetricCard
          label="Outstanding Balance"
          value={formatMoney(outstandingBalance)}
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          note="Balance due on active reservations"
        />
        <MetricCard
          label="Refunds Issued"
          value={formatMoney(refundsIssued)}
          icon={<CreditCard className="h-4 w-4 text-zinc-400" />}
          note="Cancelled and rejected bookings"
        />
      </div>

      <div className="mb-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 border-[0.5px] border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-black" />
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-black">Monthly Cashflow</h2>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {ledgerRows.length} visible records
            </p>
          </div>

          {monthlyCashflow.length === 0 ? (
            <p className="py-12 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">No cashflow data yet.</p>
          ) : (
            <div className="space-y-6">
              {monthlyCashflow.map((month) => {
                const grossWidth = grossRevenue > 0 ? (month.gross / grossRevenue) * 100 : 0;
                const netWidth = netRevenue > 0 ? (month.net / netRevenue) * 100 : 0;

                return (
                  <div key={month.key}>
                    <div className="mb-2 flex items-end justify-between">
                      <div>
                        <p className="text-sm font-bold text-black">{month.label}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          {month.bookings} bookings · Deposits {formatMoney(month.deposits)} · Refunds {formatMoney(month.refunds)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Gross</p>
                        <p className="text-sm font-bold text-black">{formatMoney(month.gross)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 w-full overflow-hidden rounded-full border-[0.5px] border-zinc-100 bg-zinc-50">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${grossWidth}%` }} className="h-full bg-black" />
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full border-[0.5px] border-zinc-100 bg-zinc-50">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${netWidth}%` }} className="h-full bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-[0.5px] border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <BarChart3 className="h-4 w-4 text-black" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-black">Collection Health</h2>
          </div>

          <div className="space-y-6">
            <StatLine label="Deposits held" value={formatMoney(depositsHeld)} hint={`${depositCoverage.toFixed(0)}% of gross`} />
            <StatLine label="Settled coverage" value={`${settlementCoverage.toFixed(0)}%`} hint="Gross value covered" />
            <StatLine label="Approved bookings" value={String(approvedBookings.length)} hint="Ready for payout" />
            <StatLine label="Open bookings" value={String(activeBookings.length)} hint="Needs follow-up" />
            <div className="pt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Average approved value</p>
              <p className="text-3xl font-bold tracking-tight text-black">{formatMoney(avgBookingValue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 border-[0.5px] border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <BarChart3 className="h-4 w-4 text-black" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-black">Venue Performance</h2>
          </div>

          <div className="space-y-8">
            {venuePerformance.length === 0 ? (
              <p className="py-12 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-300">No approved revenue yet.</p>
            ) : (
              venuePerformance.map((venue) => {
                const percentage = grossRevenue > 0 ? (venue.revenue / grossRevenue) * 100 : 0;

                return (
                  <div key={venue.name}>
                    <div className="mb-2 flex items-end justify-between">
                      <p className="text-xs font-bold text-black">{venue.name}</p>
                      <p className="text-[10px] font-bold text-zinc-400">{formatMoney(venue.revenue)}</p>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden border-[0.5px] border-zinc-100 bg-zinc-50">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full bg-black" />
                    </div>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-300">{venue.count} bookings</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 border-[0.5px] border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="p-8 border-b-[0.5px] border-zinc-100">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-black">Transaction Ledger</h2>
              <button
                onClick={handleExportCsv}
                disabled={ledgerRows.length === 0}
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:text-black disabled:text-zinc-300"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-[0.5px] border-zinc-200 bg-zinc-50/30">
                  <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400">Ref ID</th>
                  <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                  <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400">Recipient</th>
                  <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                  <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400">Balance Due</th>
                  <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400">Amount</th>
                  <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y-[0.5px] divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-200">
                      Syncing Finance Data...
                    </td>
                  </tr>
                ) : ledgerRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-200">
                      {searchTerm ? "No matching transactions." : "No transactions recorded."}
                    </td>
                  </tr>
                ) : (
                  ledgerRows.map((row) => (
                    <tr key={row.booking.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-8 py-5 text-[11px] font-bold text-black uppercase tracking-tight">{row.booking.referenceId}</td>
                      <td className="px-8 py-5 text-[11px] font-medium text-zinc-500">
                        {row.bookingDate ? format(row.bookingDate, "MMM d, yyyy") : "-"}
                      </td>
                      <td className="px-8 py-5 text-[11px] font-bold text-black">{row.booking.customerName}</td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${toneClasses[row.tone]}`}>
                          {row.paymentLabel}
                        </span>
                        <p className="mt-1 text-[10px] font-medium text-zinc-400">{row.paymentHint}</p>
                      </td>
                      <td className="px-8 py-5 text-[11px] font-bold text-black">
                        {row.balanceDue > 0 ? formatMoney(row.balanceDue) : "RM 0.00"}
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-black">{formatMoney(row.finance.netAmount)}</p>
                          <p className="text-[10px] font-medium text-zinc-400">
                            Gross {formatMoney(row.finance.grossAmount)} · Deposit {formatMoney(row.finance.depositAmount)} · Refund {formatMoney(row.finance.refundAmount)}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRow(row)}
                          className="p-2 text-zinc-300 transition-all hover:bg-zinc-100 hover:text-black"
                          aria-label={`View finance details for ${row.booking.referenceId}`}
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-zinc-50/30 border-t-[0.5px] border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">End of financial report</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedRow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
            onClick={() => setSelectedRow(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="w-full max-w-2xl overflow-hidden border-[0.5px] border-zinc-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between bg-zinc-900 px-8 py-6 text-white">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Receipt Preview</p>
                  <h2 className="font-serif text-2xl tracking-tight">{selectedRow.booking.referenceId}</h2>
                </div>
                <button onClick={() => setSelectedRow(null)} className="rounded-full p-2 hover:bg-white/10 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-8 p-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Booking Snapshot</h3>
                    <div className="space-y-2 text-sm text-zinc-600">
                      <p><span className="font-bold text-black">Customer:</span> {selectedRow.booking.customerName}</p>
                      <p><span className="font-bold text-black">Venue:</span> {selectedRow.booking.venueName}</p>
                      <p><span className="font-bold text-black">Date:</span> {selectedRow.bookingDate ? format(selectedRow.bookingDate, "PPP") : "-"}</p>
                      <p><span className="font-bold text-black">Status:</span> {selectedRow.status}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Payment State</h3>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${toneClasses[selectedRow.tone]}`}>
                      {selectedRow.paymentLabel}
                    </span>
                    <p className="mt-2 text-sm text-zinc-500">{selectedRow.paymentHint}</p>
                  </div>
                </div>

                <div className="bg-zinc-50 p-6 border-[0.5px] border-zinc-200">
                  <h3 className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    <CreditCard className="h-3 w-3" /> Financial Breakdown
                  </h3>
                  <div className="space-y-3 text-sm">
                    <Row label="Gross" value={formatMoney(selectedRow.finance.grossAmount)} />
                    <Row label="Deposit" value={formatMoney(selectedRow.finance.depositAmount)} />
                    <Row label="Refund" value={formatMoney(selectedRow.finance.refundAmount)} />
                    <Row label="Balance Due" value={selectedRow.balanceDue > 0 ? formatMoney(selectedRow.balanceDue) : "RM 0.00"} />
                    <div className="my-4 h-[0.5px] bg-zinc-200" />
                    <Row label="Net" value={formatMoney(selectedRow.finance.netAmount)} strong />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getPaymentState(booking: Booking, finance: BookingFinanceSummary, balanceDue: number) {
  const status = getBookingStatus(booking);

  if (status === "rejected" || status === "cancelled") {
    return {
      paymentLabel: finance.refundAmount > 0 ? "Refunded" : "Closed",
      paymentHint: finance.refundAmount > 0 ? `${formatMoney(finance.refundAmount)} refunded` : "No further payment action",
      tone: "neutral" as const
    };
  }

  if (status === "pending") {
    return {
      paymentLabel: finance.depositAmount > 0 ? "Deposit Due" : "Awaiting Deposit",
      paymentHint: finance.depositAmount > 0 ? `${formatMoney(finance.depositAmount)} deposit requested` : "Awaiting confirmation",
      tone: "warning" as const
    };
  }

  if (balanceDue <= 0) {
    return {
      paymentLabel: "Settled",
      paymentHint: "Ready for payout",
      tone: "success" as const
    };
  }

  if (finance.refundAmount > 0) {
    return {
      paymentLabel: "Partially Refunded",
      paymentHint: `${formatMoney(balanceDue)} still outstanding`,
      tone: "info" as const
    };
  }

  return {
    paymentLabel: "Balance Due",
    paymentHint: `${formatMoney(balanceDue)} outstanding`,
    tone: "warning" as const
  };
}

const toneClasses: Record<LedgerRow["tone"], string> = {
  neutral: "bg-zinc-50 text-zinc-700 border-zinc-200",
  success: "bg-green-50 text-green-700 border-green-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  danger: "bg-red-50 text-red-700 border-red-100",
  info: "bg-blue-50 text-blue-700 border-blue-100"
};

function MetricCard({
  label,
  value,
  note,
  icon
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
}) {
  return (
    <div className="border-[0.5px] border-zinc-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
        {icon}
      </div>
      <h3 className="text-4xl font-bold tracking-tight text-black font-sans">{value}</h3>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{note}</p>
    </div>
  );
}

function StatLine({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <p className="text-xl font-bold tracking-tight text-black">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 text-right">{hint}</p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[11px] ${strong ? "font-bold text-black" : "font-medium text-zinc-500"}`}>{label}</span>
      <span className={`text-[11px] ${strong ? "font-bold text-black" : "font-medium text-zinc-500"}`}>{value}</span>
    </div>
  );
}
