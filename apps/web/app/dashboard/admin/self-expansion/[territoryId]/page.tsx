"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "@/components/autonomy/autonomy-styles";

export default function SelfExpansionTerritoryDetailPage() {
  const params = useParams();
  const territoryId = typeof params?.territoryId === "string" ? params.territoryId : "";

  const [data, setData] = useState<{
    profile?: { city: string; readinessBand: string; dominationScore: number };
    recommendation?: {
      title: string;
      summary: string;
      expansionScore: number;
      confidenceScore: number;
      entryHub: string;
      phaseSuggested: string;
      explanation: {
        whyPrioritized: string;
        whyThisHub: string;
        majorRisks: string[];
        phaseRationale: string;
        dataBasisNote: string;
      };
      scoreBreakdown: { strengths: string[]; blockers: string[] };
      phasePlan: { phaseGoals: string[]; phaseBlockers: string[]; exitCriteria: string[] };
    };
    recommendationHistory?: Array<{ id: string; decisionStatus: string; title: string; lastRefreshedAt: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!territoryId) return;
    setError(null);
    try {
      const res = await fetch(`/api/mobile/admin/self-expansion/${encodeURIComponent(territoryId)}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "load_failed");
        return;
      }
      setData(j);
    } catch {
      setError("network_error");
    }
  }, [territoryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const r = data?.recommendation;

  return (
    <div className="min-h-screen bg-black pb-16 pt-8 text-[#f4efe4]">
      <div className="mx-auto max-w-[900px] space-y-6 px-4">
        <Link href="/dashboard/admin/self-expansion" className={`text-sm ${autonomyMuted} hover:text-[#E8D889]`}>
          ← Back to expansion board
        </Link>
        <h1 className={`font-serif text-3xl ${autonomyGoldText}`}>
          {data?.profile?.city ?? territoryId}
        </h1>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {r ?
          <>
            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`mb-2 text-lg font-semibold ${autonomyGoldText}`}>Score & strategy</h2>
              <p className="font-medium">{r.title}</p>
              <p className={`mt-2 text-sm ${autonomyMuted}`}>{r.summary}</p>
              <p className="mt-4 text-sm text-[#c9b667]">
                Expansion score {Math.round(r.expansionScore)} · Confidence {(r.confidenceScore * 100).toFixed(0)}% ·
                Lead hub {r.entryHub} · Phase {r.phaseSuggested}
              </p>
            </section>

            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`mb-2 text-lg font-semibold ${autonomyGoldText}`}>Explainability</h2>
              <p className="text-sm">{r.explanation.whyPrioritized}</p>
              <p className={`mt-3 text-sm ${autonomyMuted}`}>{r.explanation.whyThisHub}</p>
              <p className={`mt-3 text-xs text-amber-100/90`}>{r.explanation.dataBasisNote}</p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-red-200/90">
                {r.explanation.majorRisks.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className={`mt-4 text-sm ${autonomyMuted}`}>{r.explanation.phaseRationale}</p>
            </section>

            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`mb-2 text-lg font-semibold ${autonomyGoldText}`}>Strengths & blockers</h2>
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <p className={autonomyMuted}>Strengths</p>
                  <ul className="mt-1 list-disc pl-5">
                    {r.scoreBreakdown.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={autonomyMuted}>Blockers</p>
                  <ul className="mt-1 list-disc pl-5">
                    {r.scoreBreakdown.blockers.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className={`${autonomyGlassCard} p-6`}>
              <h2 className={`mb-2 text-lg font-semibold ${autonomyGoldText}`}>Phase plan</h2>
              <p className="text-sm font-medium">Goals</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {r.phasePlan.phaseGoals.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-medium">Blockers</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {r.phasePlan.phaseBlockers.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-medium">Exit criteria</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {r.phasePlan.exitCriteria.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </section>
          </>
        : null}

        <section className={`${autonomyGlassCard} p-6`}>
          <h2 className={`mb-2 text-lg font-semibold ${autonomyGoldText}`}>Recommendation history</h2>
          <ul className="space-y-2 text-sm">
            {(data?.recommendationHistory ?? []).map((h) => (
              <li key={h.id} className="flex justify-between gap-2 border-b border-[#D4AF37]/10 py-2">
                <span>{h.title}</span>
                <span className="text-xs text-[#b8a66a]">
                  {h.decisionStatus} · {new Date(h.lastRefreshedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
