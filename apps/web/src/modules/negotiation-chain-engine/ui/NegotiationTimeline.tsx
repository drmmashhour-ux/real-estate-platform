"use client";

import type { NegotiationVersionWithDetails } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";
import { NegotiationTimelineCard } from "@/src/modules/negotiation-chain-engine/ui/NegotiationTimelineCard";

type Props = {
  history: NegotiationVersionWithDetails[];
  activeVersion: NegotiationVersionWithDetails | null;
  onPresetCompare: (fromIndex: number, toIndex: number) => void;
  documentHref?: string | null;
  collapsibleDiff?: boolean;
};

export function NegotiationTimeline({ history, activeVersion, onPresetCompare, documentHref, collapsibleDiff }: Props) {
  const sorted = [...history].sort((a, b) => a.versionNumber - b.versionNumber);
  const activeVersionId = activeVersion?.id ?? null;
  const activeIndex = activeVersionId ? sorted.findIndex((v) => v.id === activeVersionId) : -1;

  if (!sorted.length) {
    return <p className="text-xs text-slate-500">No versions in this chain yet.</p>;
  }

  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Offer &amp; counter timeline</p>
      <div className="relative">
        <div className="absolute bottom-0 left-[11px] top-2 w-px bg-gradient-to-b from-premium-gold/60 via-premium-gold/25 to-transparent" aria-hidden />
        <ol className="space-y-4">
          {sorted.map((v, i) => {
            const prev = i > 0 ? sorted[i - 1]! : null;
            return (
              <li key={v.id} className="relative pl-8">
                <span
                  className="absolute left-1 top-3 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a0a] bg-premium-gold shadow-[0_0_0_1px_rgb(var(--premium-gold-channels) / 0.35)]"
                  aria-hidden
                />
                <NegotiationTimelineCard
                  version={v}
                  prev={prev}
                  sortedIndex={i}
                  activeIndex={activeIndex}
                  activeVersionId={activeVersionId}
                  onPresetCompare={onPresetCompare}
                  documentHref={documentHref}
                  collapsibleDiff={collapsibleDiff}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
