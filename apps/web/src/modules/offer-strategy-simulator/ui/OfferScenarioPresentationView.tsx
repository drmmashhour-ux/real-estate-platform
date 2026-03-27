"use client";

import type { OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import {
  filterPresentationWarnings,
  formatMoneyCents,
  presentationSummaryLines,
  primaryNextStep,
  readinessStatusLabel,
  riskLevelLabel,
  riskNarrative,
  timelineLine,
  whyThisStrategy,
} from "@/src/modules/offer-strategy-simulator/ui/simulatorPresentationCopy";
import { ScenarioWhyCard } from "@/src/modules/offer-strategy-simulator/ui/ScenarioWhyCard";

type Props = {
  result: OfferSimulationResult;
  title?: string;
  offerPriceCents: number;
  depositAmountCents: number | null;
  occupancyDate: string | null;
  signatureDate: string | null;
  listPriceCents: number;
  /** Tighter layout for compare columns */
  compact?: boolean;
  /** Hide the primary CTA (e.g. compare grid uses one shared CTA below). */
  hideCta?: boolean;
  /** Hide footer disclaimer (parent shows once). */
  hideDisclaimer?: boolean;
};

/**
 * Client presentation: max five content blocks + one primary CTA + short disclaimer.
 * No numeric scores, leverage, or confidence %.
 */
export function OfferScenarioPresentationView({
  result,
  title = "Your scenario at a glance",
  offerPriceCents,
  depositAmountCents,
  occupancyDate,
  signatureDate,
  listPriceCents,
  compact,
  hideCta,
  hideDisclaimer,
}: Props) {
  const summaryLines = presentationSummaryLines(result);
  const protections = result.recommendedProtections.slice(0, 5);
  const warnings = filterPresentationWarnings(result.keyWarnings);
  const nextStep = primaryNextStep(result);
  const why = whyThisStrategy(result);

  const pad = compact ? "p-3" : "p-4";
  const gap = compact ? "gap-3" : "gap-4";

  return (
    <div className={`flex flex-col ${gap} ${compact ? "" : "border-t border-white/10 pt-4"}`}>
      {/* 1 — Title + summary */}
      <div className={`rounded-xl border border-[#C9A646]/25 bg-[#101010] ${pad}`}>
        <h3 className="text-base font-semibold tracking-tight text-white">{title}</h3>
        <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-300">
          {summaryLines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      {/* 2 — Key numbers */}
      <div className={`rounded-xl border border-white/10 bg-[#121212] ${pad}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Numbers in this illustration</p>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
          <li>
            Offer: <span className="font-medium text-white">{formatMoneyCents(offerPriceCents)}</span>
            <span className="text-slate-500"> (vs list {formatMoneyCents(listPriceCents)})</span>
          </li>
          <li>
            Deposit:{" "}
            {depositAmountCents != null ? (
              <span className="font-medium text-white">{formatMoneyCents(depositAmountCents)}</span>
            ) : (
              <span className="text-slate-400">Not set</span>
            )}
          </li>
          <li className="text-slate-400">{timelineLine(occupancyDate, signatureDate)}</li>
        </ul>
      </div>

      {/* 3 — Protections */}
      <div className={`rounded-xl border border-white/10 bg-[#121212] ${pad}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Protections included</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
          {protections.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      {/* 4 — Risk + readiness */}
      <div className={`rounded-xl border border-white/10 bg-[#121212] ${pad}`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Risk level</p>
            <p className="mt-1 text-sm font-medium text-white">{riskLevelLabel(result.riskImpact.band)}</p>
            <p className="mt-1 text-xs leading-snug text-slate-400">{riskNarrative(result)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Readiness</p>
            <p className="mt-1 text-sm font-medium text-white">{readinessStatusLabel(result.readinessImpact.band)}</p>
          </div>
        </div>
        {warnings.length > 0 ? (
          <ul className="mt-3 space-y-1.5 border-t border-white/5 pt-3 text-xs text-amber-100/90">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* 5 — Why + one primary next step (same card) */}
      <ScenarioWhyCard text={why} nextStep={nextStep} />

      {!hideCta ? (
        <button
          type="button"
          className="w-full rounded-xl bg-[#C9A646] py-3.5 text-center text-base font-semibold text-black shadow-lg shadow-black/30 transition hover:bg-[#ddb84d] focus:outline-none focus:ring-2 focus:ring-[#C9A646]/50"
        >
          Talk this through with your broker or lawyer
        </button>
      ) : null}

      {!hideDisclaimer ? (
        <p className="text-center text-[11px] leading-relaxed text-slate-500">{result.disclaimer}</p>
      ) : null}
    </div>
  );
}
