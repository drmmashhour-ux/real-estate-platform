"use client";

import type { PropertyLegalRiskScore } from "@/modules/legal/scoring/property-legal-risk.types";

export function PropertyLegalRiskScoreCard({ score }: { score: PropertyLegalRiskScore | null }) {
  if (!score) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-950/80 p-4 text-sm text-zinc-400">
        Legal risk index unavailable for this listing context.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/25 bg-zinc-950 p-4 text-zinc-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Property legal risk index</p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {score.score}
        <span className="ml-2 text-sm font-normal text-zinc-400">/ 100 · {score.level}</span>
      </p>
      <p className="mt-2 text-sm text-zinc-300">{score.summary}</p>
      <ul className="mt-3 space-y-1 text-xs text-zinc-400">
        {score.factors.slice(0, 5).map((f) => (
          <li key={f.id}>
            <span className="text-amber-100/90">{f.label}</span> — {f.explanation}
          </li>
        ))}
      </ul>
    </div>
  );
}
