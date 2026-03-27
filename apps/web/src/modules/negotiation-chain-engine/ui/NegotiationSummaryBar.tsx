"use client";

import { financingTermsSummary, formatMoneyCents } from "@/src/modules/negotiation-chain-engine/lib/negotiationUiFormat";
import type { NegotiationVersionWithDetails } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";
import { NegotiationStatusBadge } from "@/src/modules/negotiation-chain-engine/ui/NegotiationStatusBadge";

type Props = {
  chainStatus: string;
  activeVersion: NegotiationVersionWithDetails | null;
  lastUpdatedIso: string | null;
};

export function NegotiationSummaryBar({ chainStatus, activeVersion, lastUpdatedIso }: Props) {
  const price = activeVersion?.terms?.priceCents ?? null;
  const deposit = activeVersion?.terms?.depositCents ?? null;
  const fin = activeVersion?.terms ? financingTermsSummary(activeVersion.terms.financingTerms) : "—";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#C9A646]/25 bg-gradient-to-br from-[#141414] via-[#0c0c0c] to-black p-4 shadow-lg shadow-black/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,166,70,0.08),transparent_55%)]" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]/90">Negotiation</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <NegotiationStatusBadge status={chainStatus} size="md" />
            {activeVersion ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-white">Active: v{activeVersion.versionNumber}</span>
                <NegotiationStatusBadge status={activeVersion.status} isFinal={activeVersion.isFinal} />
              </div>
            ) : (
              <span className="text-sm text-slate-500">No active version</span>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-right">
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">Price</dt>
            <dd className="font-semibold tabular-nums text-white">{formatMoneyCents(price)}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">Deposit</dt>
            <dd className="font-medium tabular-nums text-slate-200">{formatMoneyCents(deposit)}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">Financing</dt>
            <dd className="text-slate-300">{fin}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1 sm:text-right">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">Last updated</dt>
            <dd className="tabular-nums text-slate-400">
              {lastUpdatedIso
                ? new Date(lastUpdatedIso).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
