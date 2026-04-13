import Link from "next/link";
import { InvestorDemoClient } from "@/components/demo/InvestorDemoClient";
import { getDemoBookingPreview } from "@/src/modules/demo/demoDataService";
import { getDemoStepScript, getShortTalkingPoints } from "@/src/modules/demo/demoScriptService";

export const dynamic = "force-dynamic";

export default async function DemoBookingPage() {
  const preview = await getDemoBookingPreview();
  const script = getDemoStepScript("booking");
  const points = getShortTalkingPoints("booking");
  const { listing } = preview;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold text-white">BNHUB booking</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{script}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 rounded-2xl border border-slate-800 bg-slate-900/25 p-6">
          <div>
            <p className="text-xs font-semibold uppercase text-amber-500/80">Selected listing</p>
            <p className="mt-1 text-lg font-semibold text-white">{listing.title}</p>
            <p className="text-sm text-slate-500">{listing.location}</p>
            <Link
              href={`/demo/property/${encodeURIComponent(listing.id)}`}
              className="mt-2 inline-block text-xs text-amber-400 hover:underline"
            >
              View property demo
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Check-in</p>
              <p className="mt-1 font-medium text-white">{preview.checkIn}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Check-out</p>
              <p className="mt-1 font-medium text-white">{preview.checkOut}</p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-sm font-semibold text-white">Pricing breakdown</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <dt>
                  ${preview.nightly} × {preview.nights} nights
                </dt>
                <dd className="text-white">${preview.subtotal}</dd>
              </div>
              <div className="flex justify-between text-slate-400">
                <dt>Cleaning</dt>
                <dd className="text-white">${preview.cleaning}</dd>
              </div>
              <div className="flex justify-between text-slate-400">
                <dt>Guest service fee (illustrative)</dt>
                <dd className="text-white">${preview.serviceFee}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-3 text-base font-semibold">
                <dt className="text-amber-200/90">Total due</dt>
                <dd className="text-amber-200">${preview.total}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
            <p className="text-sm font-medium text-amber-100/90">Booking CTA (demo-safe)</p>
            <p className="mt-2 text-xs text-slate-400">
              Production uses Stripe Connect checkout. This page does not initiate a charge — it proves structure and
              monetization path only.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-lg bg-amber-500/40 py-3 text-sm font-semibold text-black/70"
            >
              Pay with Stripe (disabled in demo)
            </button>
          </div>

          <p className="text-xs text-slate-600">{preview.stripeNote}</p>
        </div>

        <div className="h-fit rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <h3 className="text-sm font-semibold text-white">Booking record</h3>
          <p className="mt-1 text-xs text-slate-500">Tracked in platform (sample / illustrative)</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Id</dt>
              <dd className="font-mono text-[11px] text-slate-400">{preview.bookingRecord.id}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Confirmation</dt>
              <dd className="text-white">{preview.bookingRecord.code}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="text-emerald-300/90">{preview.bookingRecord.status}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Total</dt>
              <dd className="text-amber-200/90">{preview.bookingRecord.totalLabel}</dd>
            </div>
          </dl>
        </div>
      </div>

      <ul className="text-sm text-slate-500">
        {points.map((p) => (
          <li key={p}>— {p}</li>
        ))}
      </ul>

      <InvestorDemoClient highlightStep="booking" />
    </div>
  );
}
