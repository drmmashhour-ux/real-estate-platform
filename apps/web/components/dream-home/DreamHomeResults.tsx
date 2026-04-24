"use client";

import type { DreamHomeMatchResult } from "@/modules/dream-home/types/dream-home.types";
import { DreamHomeProfileView } from "./DreamHomeProfileView";
import { DreamHomeTopMatches } from "./DreamHomeTopMatches";
import { DreamHomeTradeoffs } from "./DreamHomeTradeoffs";

type Props = {
  result: DreamHomeMatchResult;
  basePath: string;
  onRefine: () => void;
};

export function DreamHomeResults({ result, basePath, onRefine }: Props) {
  const { profile, listings, tradeoffs, source, warnings } = result;
  const mergedTradeoffs = [...(profile.tradeoffs ?? []), ...tradeoffs];

  return (
    <div className="mt-10 space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="rounded-full border border-white/10 px-2 py-0.5">
          {source === "ai" ? "Profile: AI narrative" : "Profile: deterministic (set OPENAI_API_KEY for AI)"}
        </span>
        {(warnings ?? []).map((w) => (
          <span key={w} className="text-amber-200/80">
            {w}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRefine}
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-200 hover:border-white/40"
        >
          Refine my preferences
        </button>
      </div>

      <DreamHomeProfileView profile={profile} />

      <div>
        <h2 className="text-lg font-semibold text-white">Top matches</h2>
        <p className="mt-1 text-xs text-slate-500">Text + filter fit; not a guarantee of property condition or legal suitability.</p>
        <DreamHomeTopMatches listings={listings} basePath={basePath} onRefine={onRefine} />
      </div>

      <DreamHomeTradeoffs items={mergedTradeoffs} />
    </div>
  );
}
