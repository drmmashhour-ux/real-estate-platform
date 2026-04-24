"use client";

import Link from "next/link";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

type Obs = {
  riskBandTrend30d: Array<{ band: string; count: number }>;
  highRiskZones: Array<{
    entityType: string;
    entityId: string;
    disputeRiskScore: number;
    predictedCategory: string;
    createdAt: Date | string;
  }>;
  ceoRiskAdjustmentsPending: Array<{ id: string; title: string; affectedDomain: string; urgency: string }>;
  note: string;
};

export function DisputePredictionObservabilityPanel(props: { data: Obs | null | undefined }) {
  const d = props.data;
  return (
    <section className={`${autonomyGlassCard} p-5`}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[#D4AF37]/15 pb-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Section 09</p>
          <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Dispute prediction & CEO adjustments</h2>
          <p className={`mt-1 text-sm ${autonomyMuted}`}>
            Advisory scores only — pairs with dispute room + prevention logs. No fault assignment.
          </p>
        </div>
        <Link
          href="/dashboard/admin/dispute-prediction"
          className="rounded-lg border border-[#D4AF37]/35 bg-black/50 px-3 py-1.5 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          Open dispute prediction →
        </Link>
      </header>

      {!d ?
        <p className={`text-sm ${autonomyMuted}`}>Dispute prediction observability unavailable.</p>
      : <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[#D4AF37]/10 bg-black/40 p-4">
            <p className={`text-xs uppercase ${autonomyMuted}`}>Risk band mix (30d)</p>
            <ul className="mt-2 space-y-1 text-sm text-[#e8dfd0]">
              {d.riskBandTrend30d.length === 0 ?
                <li className={autonomyMuted}>No snapshots.</li>
              : d.riskBandTrend30d.map((r) => (
                  <li key={r.band} className="flex justify-between gap-2">
                    <span>{r.band}</span>
                    <span className={autonomyGoldText}>{r.count}</span>
                  </li>
                ))
              }
            </ul>
          </div>
          <div className="rounded-xl border border-[#D4AF37]/10 bg-black/40 p-4">
            <p className={`text-xs uppercase ${autonomyMuted}`}>High-risk entities (sample)</p>
            <ul className="mt-2 max-h-44 space-y-2 overflow-y-auto text-xs text-[#e8dfd0]">
              {d.highRiskZones.length === 0 ?
                <li className={autonomyMuted}>None in window.</li>
              : d.highRiskZones.map((z) => (
                  <li key={`${z.entityType}-${z.entityId}-${String(z.createdAt)}`}>
                    {z.entityType} · {z.entityId.slice(0, 10)}… · {z.predictedCategory}{" "}
                    <span className="text-amber-200/90">({z.disputeRiskScore})</span>
                  </li>
                ))
              }
            </ul>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/15 p-4 lg:col-span-2">
            <p className="text-xs uppercase text-amber-100/90">AI CEO adjustment drafts (pending)</p>
            <ul className="mt-2 space-y-1 text-sm text-[#e8dfd0]">
              {d.ceoRiskAdjustmentsPending.length === 0 ?
                <li className={autonomyMuted}>No pending proposals.</li>
              : d.ceoRiskAdjustmentsPending.map((p) => (
                  <li key={p.id}>
                    <span className="font-medium text-[#D4AF37]">{p.title}</span> · {p.affectedDomain} · urgency{" "}
                    {p.urgency}
                  </li>
                ))
              }
            </ul>
          </div>
          <p className={`lg:col-span-2 text-[11px] leading-relaxed ${autonomyMuted}`}>{d.note}</p>
        </div>
      }
    </section>
  );
}
