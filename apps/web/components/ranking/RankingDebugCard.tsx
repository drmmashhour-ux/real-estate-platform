"use client";

import { RankingFactorsPanel } from "./RankingFactorsPanel";
import type { UnifiedRankingExplanation } from "@/modules/ranking/ranking-factors.service";

export function RankingDebugCard({ data }: { data: UnifiedRankingExplanation }) {
  return (
    <div className="space-y-4 rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-amber-50">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">Admin · ranking debug</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{data.rankingScore}</p>
      </div>
      <RankingFactorsPanel factors={data.factors} />
      <ul className="list-inside list-disc space-y-1 text-xs text-amber-100/80">
        {data.reasons.slice(0, 12).map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
