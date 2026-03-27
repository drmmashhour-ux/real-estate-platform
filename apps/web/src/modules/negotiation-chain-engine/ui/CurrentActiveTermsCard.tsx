"use client";

import type { NegotiationVersionWithDetails } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";
import { financingTermsSummary, formatMoneyCents } from "@/src/modules/negotiation-chain-engine/lib/negotiationUiFormat";
import { NegotiationStatusBadge } from "@/src/modules/negotiation-chain-engine/ui/NegotiationStatusBadge";

function jsonPreview(label: string, value: unknown) {
  if (value == null || (typeof value === "object" && Object.keys(value as object).length === 0)) {
    return (
      <div>
        <dt className="text-[10px] uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="text-xs text-slate-400">—</dd>
      </div>
    );
  }
  const str =
    typeof value === "object" ? JSON.stringify(value, null, 0).slice(0, 280) : String(value);
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="break-words font-mono text-[11px] leading-relaxed text-slate-300">
        {str.length >= 280 ? `${str.slice(0, 277)}…` : str}
      </dd>
    </div>
  );
}

type Props = {
  version: NegotiationVersionWithDetails | null;
};

export function CurrentActiveTermsCard({ version }: Props) {
  if (!version?.terms) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-slate-500">
        No operative terms on file — start an offer to populate this card.
      </div>
    );
  }

  const t = version.terms;
  const activeClauses = version.clauses.filter((c) => !c.removed).length;

  const isDominantAccepted = version.status === "accepted" && version.isFinal;
  const isDominantPending = version.status === "pending";

  const ring =
    isDominantAccepted
      ? "ring-2 ring-emerald-500/50 shadow-emerald-900/20"
      : isDominantPending
        ? "ring-2 ring-amber-400/45 shadow-amber-900/20"
        : "ring-1 ring-white/10";

  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-b from-[#121212] to-black p-4 shadow-xl ${ring}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Current active terms</p>
          <p className="mt-1 text-lg font-bold text-white">v{version.versionNumber}</p>
        </div>
        <NegotiationStatusBadge status={version.status} isFinal={version.isFinal} size="md" />
      </div>
      <div className="mt-3 space-y-3">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[10px] uppercase text-slate-500">Price</dt>
            <dd className="font-semibold tabular-nums text-white">{formatMoneyCents(t.priceCents)}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-slate-500">Deposit</dt>
            <dd className="tabular-nums text-slate-200">{formatMoneyCents(t.depositCents)}</dd>
          </div>
        </dl>
        <div className="rounded-lg border border-white/5 bg-black/30 p-3 space-y-2">
          {jsonPreview("Financing terms", t.financingTerms)}
          {jsonPreview("Commission terms", t.commissionTerms)}
          {jsonPreview("Deadlines", t.deadlines)}
        </div>
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-400">Active clauses:</span> {activeClauses}
        </p>
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] leading-relaxed text-amber-100/90">
          Only the current active version is operative in workflow tools (signing, approvals, drafting context). Historical
          versions are read-only.
        </p>
      </div>
    </div>
  );
}
