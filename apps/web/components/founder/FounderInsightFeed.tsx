"use client";

import type { CompanyInsight } from "@/modules/company-insights/company-insights.types";

export function FounderInsightFeed({ insights }: { insights: CompanyInsight[] }) {
  if (!insights.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-500">
        Synthèse d’insights désactivée ou vide — activer{" "}
        <code className="text-amber-200/80">FEATURE_COMPANY_INSIGHT_SYNTHESIS_V1</code>.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
      <h3 className="text-sm font-semibold text-zinc-100">Insights structurés</h3>
      <ul className="mt-3 max-h-80 space-y-3 overflow-y-auto text-sm">
        {insights.slice(0, 12).map((i) => (
          <li key={i.title + i.insightType} className="border-b border-zinc-800/80 pb-2">
            <div className="font-medium text-zinc-200">{i.title}</div>
            <div className="text-zinc-400">{i.summary}</div>
            <div className="mt-1 text-xs text-zinc-500">
              {i.category} · urgence {i.urgency} · confiance {(i.confidence * 100).toFixed(0)}%
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
