"use client";

import * as React from "react";
import { LeadUnlockButton } from "./LeadUnlockButton";

export type LeadPreviewCardProps = {
  leadId: string;
  displayName: string;
  city: string;
  intentLabel: string;
  priceRangeLabel?: string | null;
  messagePreview?: string;
  score?: number;
  unlockPriceCad: number;
  temperatureBadge?: string;
  /** When set, shows a quality ribbon (e.g. high / premium band). */
  qualityBadgeLabel?: string | null;
  /** High demand signal from dynamic pricing (advisory). */
  demandBadgeLabel?: string | null;
  /** Advisory only — does not change checkout amount. */
  advisorySuggestedPriceCad?: number | null;
  accent?: string;
  useMonetizationUnlockApi?: boolean;
};

/**
 * Locked lead preview — never pass raw email/phone/name before unlock.
 */
export function LeadPreviewCard({
  leadId,
  displayName,
  city,
  intentLabel,
  priceRangeLabel,
  messagePreview,
  score,
  unlockPriceCad,
  temperatureBadge,
  qualityBadgeLabel,
  demandBadgeLabel,
  advisorySuggestedPriceCad,
  accent = "#10b981",
  useMonetizationUnlockApi = true,
}: LeadPreviewCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:scale-[1.01]"
      style={{ borderColor: `${accent}40`, backgroundColor: "rgba(255,255,255,0.04)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/10 to-slate-950/65"
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-white">{displayName}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {city || "Location TBD"} · Intent: {intentLabel}
            </p>
            {priceRangeLabel ? (
              <p className="mt-1 text-xs text-slate-300">Approx. range: {priceRangeLabel}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            {temperatureBadge ? (
              <span className="text-xs font-medium" style={{ color: accent }}>
                {temperatureBadge}
              </span>
            ) : null}
            {qualityBadgeLabel ? (
              <span className="max-w-[11rem] rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                {qualityBadgeLabel}
              </span>
            ) : null}
            {demandBadgeLabel ? (
              <span className="max-w-[11rem] rounded-full border border-sky-500/40 bg-sky-950/40 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
                {demandBadgeLabel}
              </span>
            ) : null}
          </div>
        </div>

        {messagePreview ? (
          <p className="mt-2 line-clamp-3 text-xs text-slate-400">{messagePreview}</p>
        ) : null}

        <ul className="mt-3 space-y-1 text-[11px] text-slate-500">
          <li>High-intent lead (score-backed routing)</li>
          <li>Verified submission</li>
          <li>Real opportunity — unlock for full contact details</li>
        </ul>

        {typeof score === "number" ? (
          <p className="mt-2 text-xs font-medium text-slate-400">Score: {score}</p>
        ) : null}
        {typeof advisorySuggestedPriceCad === "number" && advisorySuggestedPriceCad > 0 ? (
          <p className="mt-1 text-[11px] text-slate-500">
            <span className="text-slate-400">Suggested price (advisory):</span>{" "}
            <span className="font-medium text-slate-300">
              ${advisorySuggestedPriceCad.toLocaleString(undefined, { maximumFractionDigits: 0 })} CAD
            </span>
          </p>
        ) : null}

        <div className="mt-4 rounded-lg border border-amber-500/35 bg-amber-950/30 p-3">
          <div className="flex items-center gap-2 text-amber-200">
            <span aria-hidden>🔒</span>
            <span className="text-sm font-semibold">Unlock this lead</span>
          </div>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">Base price</p>
          <p className="mt-0.5 text-lg font-bold text-white">
            ${unlockPriceCad.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
            <span className="text-xs font-normal text-slate-400">CAD</span>
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Checkout uses this anchor — advisory suggestions above do not auto-apply.</p>
          <div className="mt-3">
            <LeadUnlockButton leadId={leadId} useMonetizationUnlockApi={useMonetizationUnlockApi} />
          </div>
        </div>
      </div>
    </div>
  );
}
