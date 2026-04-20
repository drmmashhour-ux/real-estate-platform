"use client";

import type { LegalTrustRankingImpact } from "@/modules/trust-ranking/legal-trust-ranking.types";

export function LegalTrustRankingImpactCard({ impact }: { impact: LegalTrustRankingImpact | null }) {
  if (!impact) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-950/80 p-4 text-sm text-zinc-400">
        Ranking impact not computed.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/25 bg-zinc-950 p-4 text-zinc-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Legal + trust ranking</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-zinc-500">Final multiplier</dt>
          <dd className="font-mono text-white">{impact.finalMultiplier.toFixed(3)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Exposure</dt>
          <dd className="text-amber-100">{impact.exposureLevel}</dd>
        </div>
      </dl>
      <ul className="mt-3 space-y-1 text-xs text-zinc-400">
        {impact.reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
