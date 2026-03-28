"use client";

import Link from "next/link";
import { useState } from "react";
import { formatNegotiationDiffSummary } from "@/src/modules/negotiation-chain-engine/application/negotiationDiffFormat";
import type { NegotiationVersionWithDetails } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";
import { diffFromPreviousVersion } from "@/src/modules/negotiation-chain-engine/lib/negotiationVersionDiffUtils";
import { formatMoneyCents } from "@/src/modules/negotiation-chain-engine/lib/negotiationUiFormat";
import { NegotiationDiffPreview } from "@/src/modules/negotiation-chain-engine/ui/NegotiationDiffPreview";
import { NegotiationStatusBadge } from "@/src/modules/negotiation-chain-engine/ui/NegotiationStatusBadge";
import { NegotiationVersionMeta } from "@/src/modules/negotiation-chain-engine/ui/NegotiationVersionMeta";

type Props = {
  version: NegotiationVersionWithDetails;
  prev: NegotiationVersionWithDetails | null;
  sortedIndex: number;
  activeIndex: number;
  activeVersionId: string | null;
  onPresetCompare: (fromIndex: number, toIndex: number) => void;
  documentHref?: string | null;
  /** Mobile: collapse diff into details */
  collapsibleDiff?: boolean;
};

export function NegotiationTimelineCard({
  version,
  prev,
  sortedIndex,
  activeIndex,
  activeVersionId,
  onPresetCompare,
  documentHref,
  collapsibleDiff,
}: Props) {
  const [fullOpen, setFullOpen] = useState(false);
  const diff = diffFromPreviousVersion(prev, version);
  const lines = diff ? formatNegotiationDiffSummary(diff) : [];

  const isCurrentActive = activeVersionId === version.id;
  const isRejected = version.status === "rejected";
  const isAcceptedFinal = version.status === "accepted" && version.isFinal;

  const surface = isCurrentActive
    ? isAcceptedFinal
      ? "border-emerald-500/45 bg-emerald-950/25 shadow-lg shadow-emerald-900/10"
      : version.status === "pending"
        ? "border-amber-400/50 bg-amber-950/20 shadow-lg shadow-amber-900/10"
        : "border-premium-gold/40 bg-[#0f0f0f]"
    : isRejected
      ? "border-rose-500/25 bg-rose-950/15 opacity-95"
      : "border-white/10 bg-black/25 opacity-90";

  return (
    <article className={`rounded-xl border px-3 py-3 transition-colors ${surface}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-white">v{version.versionNumber}</span>
            <NegotiationStatusBadge status={version.status} isFinal={version.isFinal} />
            {isCurrentActive ? (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-premium-gold">
                Active
              </span>
            ) : null}
          </div>
          <div className="mt-1">
            <NegotiationVersionMeta version={version} compact />
          </div>
        </div>
        {version.terms ? (
          <div className="text-right text-[11px] text-slate-400">
            <p className="tabular-nums text-slate-200">{formatMoneyCents(version.terms.priceCents)}</p>
            <p className="text-slate-500">dep {formatMoneyCents(version.terms.depositCents)}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-2">
        {!prev ? (
          <p className="text-[11px] text-slate-500">Initial recorded terms.</p>
        ) : (
          <NegotiationDiffPreview diff={diff} collapsible={collapsibleDiff} title="Changes vs prior" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFullOpen((o) => !o)}
          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-white/10"
        >
          {fullOpen ? "Hide" : "View"} full version
        </button>
        {prev ? (
          <button
            type="button"
            onClick={() => onPresetCompare(sortedIndex - 1, sortedIndex)}
            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-white/10"
          >
            Compare with previous
          </button>
        ) : null}
        {activeIndex >= 0 && sortedIndex !== activeIndex ? (
          <button
            type="button"
            onClick={() => onPresetCompare(sortedIndex, activeIndex)}
            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-white/10"
          >
            Compare with current
          </button>
        ) : null}
        {documentHref ? (
          <Link
            href={documentHref}
            className="rounded-lg border border-premium-gold/30 bg-premium-gold/10 px-2.5 py-1.5 text-[11px] font-medium text-premium-gold hover:bg-premium-gold/20"
          >
            Open case
          </Link>
        ) : null}
      </div>

      {fullOpen && version.terms ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[10px] leading-relaxed text-slate-400">
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words">
            {JSON.stringify(
              {
                priceCents: version.terms.priceCents,
                depositCents: version.terms.depositCents,
                financingTerms: version.terms.financingTerms,
                commissionTerms: version.terms.commissionTerms,
                deadlines: version.terms.deadlines,
                clauses: version.clauses,
              },
              null,
              2,
            )}
          </pre>
        </div>
      ) : null}
    </article>
  );
}
