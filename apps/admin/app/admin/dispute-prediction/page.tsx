"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "@/components/autonomy/autonomy-styles";

type DashboardPayload = {
  highRiskCases?: Array<{
    id: string;
    entityType: string;
    entityId: string;
    disputeRiskScore: number;
    predictedCategory: string;
  }>;
  predictedCategoryMix?: Array<{ category: string; count: number }>;
  learnedPatterns?: Array<{ patternKey: string; confidence: number; sampleSize: number }>;
  topFrictionSources?: Array<{ signalId: string; count: number }>;
  ceoAdjustments?: Array<{ id: string; title: string; status: string; affectedDomain: string }>;
  preventedVsActualDisputes?: { note?: string };
};

export default function AdminDisputePredictionPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dispute-prediction/dashboard");
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
            <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Admin · Advisory only</p>
            <h1 className={`font-serif text-3xl ${autonomyGoldText}`}>Dispute prediction</h1>
            <p className={`mt-2 max-w-2xl text-sm ${autonomyMuted}`}>
              Probabilistic friction scoring — not legal fault. Prevention actions are reminders, visibility, and manual
              review queues (policy-gated).
            </p>
          </div>
          <Link href="/dashboard/admin/autonomy-command-center" className="text-sm text-[#D4AF37] hover:underline">
            ← Command center
          </Link>
        </div>

        {error ?
          <p className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm">{error}</p>
        : null}
        {loading && !data ?
          <p className={`text-sm ${autonomyMuted}`}>Loading prediction intelligence…</p>
        : null}

        {data ?
          <>
            <section className={`${autonomyGlassCard} p-5`}>
              <h2 className={`mb-4 font-serif text-xl ${autonomyGoldText}`}>High-risk cases (recent)</h2>
              <ul className="space-y-2 text-sm">
                {(data.highRiskCases ?? []).slice(0, 15).map((r) => (
                  <li key={r.id} className="flex flex-wrap gap-2 border-b border-[#D4AF37]/10 py-2 text-[#e8dfd0]">
                    <span>{r.entityType}</span>
                    <span className="text-[#b8b3a8]">{r.entityId.slice(0, 14)}…</span>
                    <span className="text-amber-200">score {r.disputeRiskScore}</span>
                    <span>{r.predictedCategory}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={`${autonomyGlassCard} p-5`}>
              <h2 className={`mb-4 font-serif text-xl ${autonomyGoldText}`}>Predicted dispute categories</h2>
              <div className="flex flex-wrap gap-2">
                {(data.predictedCategoryMix ?? []).map((c) => (
                  <span
                    key={c.category}
                    className="rounded-full border border-[#D4AF37]/30 px-3 py-1 text-xs text-[#e8dfd0]"
                  >
                    {c.category}: {c.count}
                  </span>
                ))}
              </div>
            </section>

            <section className={`${autonomyGlassCard} p-5`}>
              <h2 className={`mb-4 font-serif text-xl ${autonomyGoldText}`}>Learned patterns</h2>
              <ul className="space-y-2 text-xs text-[#e8dfd0]">
                {(data.learnedPatterns ?? []).slice(0, 12).map((p) => (
                  <li key={p.patternKey}>
                    <span className={autonomyGoldText}>{p.patternKey.slice(0, 80)}</span> · conf {p.confidence.toFixed(2)}{" "}
                    · n={p.sampleSize}
                  </li>
                ))}
              </ul>
            </section>

            <section className={`${autonomyGlassCard} p-5`}>
              <h2 className={`mb-4 font-serif text-xl ${autonomyGoldText}`}>Top friction sources</h2>
              <ul className="text-sm text-[#e8dfd0]">
                {(data.topFrictionSources ?? []).map((t) => (
                  <li key={t.signalId}>
                    {t.signalId} <span className={autonomyGoldText}>×{t.count}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={`${autonomyGlassCard} p-5`}>
              <h2 className={`mb-4 font-serif text-xl ${autonomyGoldText}`}>AI CEO adjustment queue</h2>
              <ul className="space-y-2 text-sm">
                {(data.ceoAdjustments ?? []).map((a) => (
                  <li key={a.id} className="border-b border-[#D4AF37]/10 py-2">
                    <span className="font-medium text-[#D4AF37]">{a.title}</span> · {a.status} · {a.affectedDomain}
                  </li>
                ))}
              </ul>
            </section>

            <p className={`text-[11px] ${autonomyMuted}`}>{data.preventedVsActualDisputes?.note}</p>
          </>
        : null}
      </div>
    </div>
  );
}
