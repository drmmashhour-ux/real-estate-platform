"use client";

import type { TrustVisibilityImpact } from "@/modules/trust/trust.types";

type Props = {
  visibility: TrustVisibilityImpact;
};

export function TrustImpactInfo({ visibility }: Props) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/25 px-3 py-3 text-xs text-[#B3B3B3]" role="note">
      <p className="font-semibold text-premium-gold">Visibility posture</p>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        <li>
          Ranking weight multiplier:{" "}
          <span className="font-mono text-[#E5E5E5]">{visibility.rankingBoost.toFixed(3)}×</span>{" "}
          <span className="text-[#737373]">(never hides listings)</span>
        </li>
        <li>
          Exposure band:{" "}
          <span className="text-[#E5E5E5]">{visibility.exposureLevel}</span>
        </li>
      </ul>
      <p className="mt-2 text-[11px] text-[#737373]">
        Multipliers adjust sort position only — transparent to operators; no undisclosed boosts.
      </p>
    </div>
  );
}
