"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Summary = {
  brokerProtectedHint: string;
  highRiskListings: { listingId: string; overallLegalRiskScore: number; latestRiskLevel: string }[];
  verificationLogCount: number;
  openAlertsApprox: number;
};

export function BrokerLegalComplianceStrip({
  locale,
  country,
}: {
  locale: string;
  country: string;
}) {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/legal/broker/summary", { credentials: "same-origin" });
      setData((await res.json()) as Summary);
    })();
  }, []);

  if (!data) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-500">
        Loading legal & compliance snapshot…
      </section>
    );
  }

  const banner =
    data.highRiskListings.length > 0
      ? "Legal Risk Detected: review disclosures, source statements, and inspection limitations."
      : null;

  return (
    <section className="rounded-2xl border border-premium-gold/25 bg-[#101010] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Legal &amp; compliance</p>
          <p className="mt-1 text-xs text-slate-500">{data.brokerProtectedHint}</p>
        </div>
        <Link
          href={`/${locale}/${country}/broker/legal`}
          className="rounded-lg border border-premium-gold/40 px-3 py-1.5 text-xs font-medium text-premium-gold hover:bg-premium-gold/10"
        >
          Open legal workspace
        </Link>
      </div>
      {banner ? <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">{banner}</p> : null}
      <dl className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
        <div>
          <dt className="text-slate-500">HIGH/CRITICAL listings</dt>
          <dd className="text-lg font-semibold text-white">{data.highRiskListings.length}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Verification logs</dt>
          <dd className="text-lg font-semibold text-white">{data.verificationLogCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Open alerts (your listings)</dt>
          <dd className="text-lg font-semibold text-white">{data.openAlertsApprox}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5"
          onClick={() =>
            void fetch("/api/legal/broker/verification-log", {
              method: "POST",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ actionKey: "verification_attempt_logged", verificationAttempted: true }),
            })
          }
        >
          Log verification attempt
        </button>
        <Link href="/legal" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5">
          Case library
        </Link>
      </div>
    </section>
  );
}
