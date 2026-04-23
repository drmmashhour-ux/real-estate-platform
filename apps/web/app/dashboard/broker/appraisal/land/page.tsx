import Link from "next/link";
import { APPRAISAL_SUPPORT_LABELS } from "@/lib/appraisal/compliance-copy";

export default function BrokerAppraisalLandPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Land / lot</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Land / lot</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          Unimproved land and lot valuation support: frontage, zoning, services, and comparable land sales. Outputs feed
          your {APPRAISAL_SUPPORT_LABELS.report.toLowerCase()} as pricing analysis, not a certified opinion.
        </p>
        <p className="mt-2 text-xs text-slate-500">{APPRAISAL_SUPPORT_LABELS.disclaimerShort}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/broker/appraisal"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:border-premium-gold/40"
          >
            ← Appraisal Hub
          </Link>
          <Link
            href="/dashboard/broker/appraisal/map"
            className="rounded-xl border border-premium-gold/40 px-4 py-2 text-sm text-premium-gold"
          >
            Map comparables
          </Link>
        </div>
      </div>
    </div>
  );
}
