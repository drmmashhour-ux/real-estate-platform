import Link from "next/link";
import { APPRAISAL_SUPPORT_LABELS } from "@/lib/appraisal/compliance-copy";

export default function BrokerAppraisalIncomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Income approach</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Income approach</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          Pricing analysis from income assumptions (NOI, cap rate, rent roll). Document assumptions in your{" "}
          {APPRAISAL_SUPPORT_LABELS.report.toLowerCase()} before broker sign-off.
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
            Map tools
          </Link>
        </div>
      </div>
    </div>
  );
}
