"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "@/components/autonomy/autonomy-styles";
import { TrustImprovementPanel } from "@/components/trust-score/TrustImprovementPanel";
import type { TrustScoreRow } from "@/components/trust-score/TrustScoreTable";
import { TrustScoreTable } from "@/components/trust-score/TrustScoreTable";

type DashboardPayload = {
  overview: { totalTargets: number; byBand: Record<string, number> };
  brokersByBand: Record<string, number>;
  listingsByBand: Record<string, number>;
  sharpestDrops: TrustScoreRow[];
  mostImproved: TrustScoreRow[];
  topNegativeFactors: Array<{ factorId: string; negativeWeight: number }>;
  improvementIdeas: string[];
  safetyNote?: string;
};

export default function AdminTrustScorePage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/trust-score/dashboard", { credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j?.error === "string" ? j.error : "dashboard_failed");
        return;
      }
      setData(j as DashboardPayload);
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-black pb-16 pt-8 text-[#f4efe4]">
      <div className="mx-auto max-w-6xl space-y-8 px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Admin · Operational</p>
            <h1 className={`font-serif text-3xl ${autonomyGoldText}`}>Trust score engine</h1>
            <p className={`mt-2 max-w-2xl text-sm ${autonomyMuted}`}>
              Explainable operational trust for prioritization — not legal fault. High-impact automation stays
              policy-gated.
            </p>
          </div>
          <Link href="/dashboard/admin/dispute-prediction" className="text-sm text-[#D4AF37] hover:underline">
            Dispute prediction →
          </Link>
        </div>

        {error ?
          <p className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm">{error}</p>
        : null}
        {loading && !data ?
          <p className={`text-sm ${autonomyMuted}`}>Loading trust intelligence…</p>
        : null}

        {data ?
          <>
            <section className={`${autonomyGlassCard} p-5`}>
              <h2 className={`mb-4 font-serif text-xl ${autonomyGoldText}`}>1. Trust score overview</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className={`text-xs uppercase ${autonomyMuted}`}>Distinct targets (rolling window)</p>
                  <p className="mt-2 text-3xl font-bold text-white">{data.overview.totalTargets}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className={`text-xs uppercase ${autonomyMuted}`}>Bands</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#e8dfd0]">
                    {Object.entries(data.overview.byBand).map(([k, v]) => (
                      <span key={k} className="rounded-full border border-[#D4AF37]/30 px-3 py-1">
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {data.safetyNote ?
                <p className={`mt-4 text-xs ${autonomyMuted}`}>{data.safetyNote}</p>
              : null}
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <section className={`${autonomyGlassCard} p-5`}>
                <h2 className={`mb-4 font-serif text-xl ${autonomyGoldText}`}>2. Brokers by band</h2>
                <ul className="space-y-1 text-sm text-[#e8dfd0]">
                  {Object.entries(data.brokersByBand).map(([k, v]) => (
                    <li key={k} className="flex justify-between border-b border-[#D4AF37]/10 py-1">
                      <span>{k}</span>
                      <span className="text-[#D4AF37]">{v}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className={`${autonomyGlassCard} p-5`}>
                <h2 className={`mb-4 font-serif text-xl ${autonomyGoldText}`}>3. Listings by band</h2>
                <ul className="space-y-1 text-sm text-[#e8dfd0]">
                  {Object.entries(data.listingsByBand).map(([k, v]) => (
                    <li key={k} className="flex justify-between border-b border-[#D4AF37]/10 py-1">
                      <span>{k}</span>
                      <span className="text-[#D4AF37]">{v}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <TrustScoreTable
              title="4. Sharpest drops"
              rows={data.sharpestDrops}
              emptyHint="No sharp drops detected in the recent snapshot window."
            />

            <TrustScoreTable
              title="5. Most improved"
              rows={data.mostImproved}
              emptyHint="No strong improvements detected in the recent snapshot window."
            />

            <section className={`${autonomyGlassCard} p-5`}>
              <h2 className={`mb-4 font-serif text-xl ${autonomyGoldText}`}>6. Top negative factors</h2>
              <ul className="space-y-2 text-sm text-[#e8dfd0]">
                {(data.topNegativeFactors ?? []).map((t) => (
                  <li key={t.factorId} className="flex justify-between gap-4 border-b border-[#D4AF37]/10 py-2">
                    <span className="font-mono text-xs">{t.factorId}</span>
                    <span className="text-amber-200">{t.negativeWeight.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={`mb-3 font-serif text-xl ${autonomyGoldText}`}>7. Actions to improve trust</h2>
              <TrustImprovementPanel items={data.improvementIdeas ?? []} />
            </section>
          </>
        : null}
      </div>
    </div>
  );
}
