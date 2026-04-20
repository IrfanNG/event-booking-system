"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck, Clock, CreditCard, AlertTriangle } from "lucide-react";

export default function PoliciesPage() {
  const searchParams = useSearchParams();
  const venueId = searchParams.get("venueId");

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-zinc-100">
      <main className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        <Link 
          href={venueId ? `/venues/${venueId}` : "/"} 
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="h-3 w-3" /> {venueId ? "Back to Venue" : "Home"}
        </Link>

        <h1 className="font-serif text-5xl font-light tracking-tighter md:text-7xl mb-8">
          Institutional Policies
        </h1>
        <p className="text-sm font-medium text-zinc-500 leading-relaxed max-w-2xl mb-24 uppercase tracking-widest">
          Terms of service, cancellation protocols, and operational guidelines for ESPACE venues.
        </p>

        <div className="space-y-24">
          <section className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="sticky top-24 flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
                <Clock className="h-4 w-4 text-zinc-400" />
                Booking & Time
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              <h3 className="font-serif text-2xl tracking-tight">Reservation Window</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                All venues require a minimum of 48 hours advance booking. Last-minute requests are subject to manual review and a 15% expediency surcharge. Time slots must be strictly adhered to; a 15-minute grace period is allowed for load-out before additional hourly rates apply.
              </p>
              
              <h3 className="font-serif text-2xl tracking-tight pt-6">Operating Hours</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Standard operating hours are from 8:00 AM to 10:00 PM. Events requiring extension beyond 10:00 PM require prior authorization and are subject to local noise ordinance regulations.
              </p>
            </div>
          </section>

          <div className="h-[0.5px] w-full bg-zinc-100" />

          <section className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="sticky top-24 flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
                <CreditCard className="h-4 w-4 text-zinc-400" />
                Payments & Fees
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              <h3 className="font-serif text-2xl tracking-tight">Service Agreement</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                A mandatory 10% service agreement fee is applied to all base venue rates. This covers standard cleaning, security personnel, and dedicated on-site technical support during your event.
              </p>
              
              <h3 className="font-serif text-2xl tracking-tight pt-6">Security Deposit</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                A refundable security deposit of RM 1,000 is required upon confirmation. This deposit will be returned within 3-5 business days post-event, subject to a satisfactory venue inspection.
              </p>
            </div>
          </section>

          <div className="h-[0.5px] w-full bg-zinc-100" />

          <section className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="sticky top-24 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-red-500">
                <AlertTriangle className="h-4 w-4" />
                Cancellations
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              <h3 className="font-serif text-2xl tracking-tight">Cancellation Protocol</h3>
              <ul className="space-y-4 text-sm text-zinc-600 leading-relaxed list-disc list-inside pl-4">
                <li><strong>14+ Days Notice:</strong> 100% full refund of base rate and service fees.</li>
                <li><strong>7-13 Days Notice:</strong> 50% refund of base rate. Service fees are fully refunded.</li>
                <li><strong>Less than 7 Days Notice:</strong> No refund on base rate. Security deposit and service fees will be refunded.</li>
              </ul>
              <p className="text-sm text-zinc-500 mt-4 italic">
                * Rescheduling is allowed once per booking without penalty, provided 7 days notice is given.
              </p>
            </div>
          </section>

          <div className="h-[0.5px] w-full bg-zinc-100" />

          <section className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="sticky top-24 flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4 text-zinc-400" />
                Usage Terms
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              <h3 className="font-serif text-2xl tracking-tight">Venue Integrity</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Clients are responsible for maintaining the structural and aesthetic integrity of the space. No permanent modifications, drilling, or painting are permitted. External catering must be pre-approved by the ESPACE management team.
              </p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t-[0.5px] border-zinc-200 bg-zinc-50 py-12 px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          ESPACE &copy; 2026. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}
