"use client";

import { useEffect, useState } from "react";

type S = {
  openCriticalLegalAlerts: number;
  monitoredHighRiskListings: number;
  commissionDisputesUnderReview: number;
  resolvedLegalEventsLast30DaysApprox: number;
};

export function InvestorComplianceSnapshot() {
  const [s, setS] = useState<S | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/legal/investor/summary", { credentials: "same-origin" });
      if (!res.ok) return;
      setS((await res.json()) as S);
    })();
  }, []);

  if (!s) return null;

  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Operational compliance (read-only)</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs text-slate-300">
        <div>
          <dt className="text-slate-500">Critical alerts open</dt>
          <dd className="text-lg font-semibold text-white">{s.openCriticalLegalAlerts}</dd>
        </div>
        <div>
          <dt className="text-slate-500">High-risk listings monitored</dt>
          <dd className="text-lg font-semibold text-white">{s.monitoredHighRiskListings}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Commission compliance flags</dt>
          <dd className="text-lg font-semibold text-white">{s.commissionDisputesUnderReview}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Alerts resolved (30d)</dt>
          <dd className="text-lg font-semibold text-white">{s.resolvedLegalEventsLast30DaysApprox}</dd>
        </div>
      </dl>
    </section>
  );
}
