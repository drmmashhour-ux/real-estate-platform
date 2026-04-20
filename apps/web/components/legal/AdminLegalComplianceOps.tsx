"use client";

import { useEffect, useState } from "react";
import { LegalAlertsTable } from "@/modules/legal/components/LegalAlertsTable";
import { LegalAuditTable } from "@/modules/legal/components/LegalAuditTable";

type Summary = {
  openAlerts: number;
  casesCount: number;
  recentHighRiskEventCount: number;
  criticalOpenAlerts: number;
};

export function AdminLegalComplianceOps() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/legal/dashboard/summary", { credentials: "same-origin" });
        const data = (await res.json()) as Summary & { error?: string };
        if (!res.ok) {
          setErr(data.error ?? "Unable to load summary");
          return;
        }
        setSummary(data);
      } catch {
        setErr("Network error");
      }
    })();
  }, []);

  return (
    <section className="rounded-xl border border-premium-gold/30 bg-[#0c0c0c] p-5">
      <h2 className="text-sm font-semibold text-premium-gold">LECIPM compliance operations</h2>
      <p className="mt-1 text-xs text-slate-500">
        Deterministic risk engine outputs, alerts, and audit entries — advisory only; not legal advice.
      </p>
      {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}
      {summary ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-4 text-xs text-slate-300">
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <dt className="text-slate-500">Open alerts</dt>
            <dd className="text-lg font-semibold text-white">{summary.openAlerts}</dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <dt className="text-slate-500">Case library</dt>
            <dd className="text-lg font-semibold text-white">{summary.casesCount}</dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <dt className="text-slate-500">High-score events</dt>
            <dd className="text-lg font-semibold text-amber-200">{summary.recentHighRiskEventCount}</dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <dt className="text-slate-500">Critical open</dt>
            <dd className="text-lg font-semibold text-red-300">{summary.criticalOpenAlerts}</dd>
          </div>
        </dl>
      ) : null}
      <div className="mt-6 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Alerts</p>
          <LegalAlertsTable admin />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Audit</p>
          <LegalAuditTable admin />
        </div>
      </div>
    </section>
  );
}
