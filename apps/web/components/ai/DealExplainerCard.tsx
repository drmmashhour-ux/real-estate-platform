"use client";

import { useEffect, useMemo, useState } from "react";
import { conversionCopy } from "@/src/design/conversionCopy";
import { ImpactBreakdown, type ImpactItem } from "@/components/ai/ImpactBreakdown";
import { WhatIfSimulator } from "@/components/ai/WhatIfSimulator";

export type ScoreLevel = "high" | "medium" | "low";

export type FactorDetail = {
  id: string;
  label: string;
  impact: "positive" | "negative";
  explanation: string;
  dataSource: string;
  impactNote: string;
};

type Props = {
  explanationText?: string | null;
  /** Longer copy shown when “Show more” is expanded */
  expandedExplanationText?: string | null;
  /** Prefer structured split; falls back to `factors` */
  reasons?: string[];
  warnings?: string[];
  factors?: string[];
  recommendation?: string | null;
  scoreLevel: ScoreLevel;
  /** 0–100 */
  confidencePercent?: number | null;
  confidenceExplanation?: string | null;
  /** For smart CTAs + what-if */
  dealScore?: number | null;
  trustScore?: number | null;
  baseRoiPercent?: number | null;
  roiDisclaimer?: string | null;
  /** Data provenance label for factor drawer */
  factorDataSourceLabel?: string;
  contactHref?: string;
  requestInfoHref?: string;
  saveHref?: string;
  analyzeDeeperHref?: string;
};

function levelStyles(level: ScoreLevel) {
  if (level === "high") {
    return {
      accent: "text-emerald-300",
      border: "border-emerald-500/40",
      bg: "bg-emerald-500/10",
      icon: "✔",
    };
  }
  if (level === "medium") {
    return {
      accent: "text-amber-200",
      border: "border-amber-500/40",
      bg: "bg-amber-500/10",
      icon: "⚠",
    };
  }
  return {
    accent: "text-rose-300",
    border: "border-rose-500/40",
    bg: "bg-rose-500/10",
    icon: "⚠",
  };
}

function fallbackExplanation(level: ScoreLevel): string {
  if (level === "high") return conversionCopy.analysis.recommendationHigh;
  if (level === "medium") return conversionCopy.analysis.recommendationMedium;
  return conversionCopy.analysis.recommendationLow;
}

function buildFactorDetails(
  reasons: string[],
  warnings: string[],
  fallbackFactors: string[],
  dataSource: string
): FactorDetail[] {
  const fromStructured: FactorDetail[] = [
    ...reasons.map((label, i) => ({
      id: `r-${i}`,
      label,
      impact: "positive" as const,
      explanation: label,
      dataSource,
      impactNote: "This signal supports the opportunity side of the thesis.",
    })),
    ...warnings.map((label, i) => ({
      id: `w-${i}`,
      label,
      impact: "negative" as const,
      explanation: label,
      dataSource,
      impactNote: "This signal increases caution or downside risk in the snapshot.",
    })),
  ];
  if (fromStructured.length) return fromStructured.slice(0, 8);
  return fallbackFactors.slice(0, 8).map((label, i) => ({
    id: `f-${i}`,
    label,
    impact: "positive" as const,
    explanation: label,
    dataSource,
    impactNote: "Derived from your analysis summary.",
  }));
}

function toImpactItems(details: FactorDetail[]): ImpactItem[] {
  const n = details.length || 1;
  return details.map((d, i) => ({
    label: d.label.length > 48 ? `${d.label.slice(0, 45)}…` : d.label,
    impact: d.impact,
    strength: Math.round(55 + (40 * (n - i)) / n),
  }));
}

type SmartMode = "contact" | "verify" | "analyze";

function resolveSmartMode(dealScore: number | null | undefined, trustScore: number | null | undefined): SmartMode {
  const ds = dealScore ?? 0;
  const ts = trustScore;
  if (ts != null && ts < 45) return "verify";
  if (ds >= 75) return "contact";
  return "analyze";
}

export function DealExplainerCard({
  explanationText,
  expandedExplanationText,
  reasons = [],
  warnings = [],
  factors = [],
  recommendation,
  scoreLevel,
  confidencePercent,
  confidenceExplanation,
  dealScore,
  trustScore,
  baseRoiPercent,
  roiDisclaimer,
  factorDataSourceLabel = "Deal analyzer & listing signals",
  contactHref = "#",
  requestInfoHref = "#",
  saveHref = "#",
  analyzeDeeperHref,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [openFactorId, setOpenFactorId] = useState<string | null>(null);

  const style = levelStyles(scoreLevel);
  const explanation = explanationText?.trim() || fallbackExplanation(scoreLevel);
  const expandBlock = expandedExplanationText?.trim() ?? "";
  const preview =
    explanation.length > 200 ? `${explanation.slice(0, 200).trim()}…` : explanation;
  const showExpandToggle = Boolean(expandBlock) || explanation.length > 200;

  const rec = recommendation?.trim() || fallbackExplanation(scoreLevel);

  const factorDetails = useMemo(
    () =>
      buildFactorDetails(
        reasons,
        warnings,
        factors.length ? factors : ["Price position vs market", "Local demand profile", "Listing trust completeness"],
        factorDataSourceLabel
      ),
    [reasons, warnings, factors, factorDataSourceLabel]
  );

  const impactItems = useMemo(() => toImpactItems(factorDetails), [factorDetails]);
  const smart = resolveSmartMode(dealScore ?? null, trustScore ?? null);
  const deeperHref = analyzeDeeperHref ?? saveHref;

  const openFactor = factorDetails.find((f) => f.id === openFactorId) ?? null;

  useEffect(() => {
    if (!openFactorId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFactorId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openFactorId]);

  const confPct =
    confidencePercent != null
      ? Math.min(100, Math.max(0, Math.round(confidencePercent)))
      : scoreLevel === "high"
        ? 82
        : scoreLevel === "medium"
          ? 62
          : 42;
  const confExplain =
    confidenceExplanation?.trim() ||
    (scoreLevel === "high"
      ? "Multiple consistent signals align with the headline score."
      : scoreLevel === "medium"
        ? "Mixed signals — validate assumptions and documents before acting."
        : "Limited or conflicting signals — treat as directional only.");

  const showWhatIf = dealScore != null && Number.isFinite(dealScore);

  return (
    <section className="rounded-xl border border-white/10 bg-[#0b0b0c] p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">AI Insight</p>
          <p className="text-xs text-slate-400">Interactive decision snapshot</p>
        </div>
        <span className={`shrink-0 text-sm font-semibold ${style.accent}`}>
          {style.icon} {scoreLevel === "high" ? "Strong" : scoreLevel === "medium" ? "Caution" : "Risk"}
        </span>
      </header>

      <div className="mt-3">
        {!expanded ? (
          <>
            <p className="text-sm leading-relaxed text-slate-200">{preview}</p>
            {showExpandToggle ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-2 text-xs font-medium text-premium-gold hover:underline"
              >
                Show more
              </button>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-200">{explanation}</p>
            {expandBlock ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{expandBlock}</p>
            ) : null}
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="mt-2 text-xs font-medium text-slate-500 hover:text-slate-300"
            >
              Show less
            </button>
          </>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Confidence</span>
          <span className="text-sm font-semibold text-white">{confPct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-premium-gold/90 transition-all" style={{ width: `${confPct}%` }} />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{confExplain}</p>
      </div>

      <ImpactBreakdown items={impactItems} />

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Key factors</p>
        <ul className="mt-2 space-y-1">
          {factorDetails.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setOpenFactorId(f.id)}
                className="flex w-full items-start gap-2 rounded-lg px-1 py-1.5 text-left text-sm text-slate-300 transition hover:bg-white/5"
              >
                <span className="mt-0.5 text-premium-gold">•</span>
                <span className="flex-1">
                  {f.label}
                  <span className={`ml-2 text-xs ${f.impact === "positive" ? "text-emerald-400/90" : "text-rose-400/90"}`}>
                    ({f.impact === "positive" ? "+" : "−"})
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {showWhatIf ? (
        <WhatIfSimulator
          baseDealScore={dealScore!}
          baseRoiPercent={baseRoiPercent ?? null}
          disclaimer={roiDisclaimer ?? undefined}
        />
      ) : null}

      <div className={`mt-4 rounded-lg border p-3 ${style.border} ${style.bg}`}>
        <p className="text-xs uppercase tracking-wide text-slate-200">Recommendation</p>
        <p className="mt-1 text-sm font-medium text-white">👉 {rec}</p>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">Suggested next step</p>
        {smart === "contact" ? (
          <a
            href={contactHref}
            className="block w-full rounded-lg bg-premium-gold px-4 py-2.5 text-center text-sm font-semibold text-black hover:bg-premium-gold"
          >
            Contact now
          </a>
        ) : smart === "verify" ? (
          <a
            href={requestInfoHref}
            className="block w-full rounded-lg bg-premium-gold px-4 py-2.5 text-center text-sm font-semibold text-black hover:bg-premium-gold"
          >
            Verify documents
          </a>
        ) : (
          <a
            href={deeperHref}
            className="block w-full rounded-lg bg-premium-gold px-4 py-2.5 text-center text-sm font-semibold text-black hover:bg-premium-gold"
          >
            Analyze deeper
          </a>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <a href={contactHref} className="rounded-lg border border-white/20 px-3 py-2 text-center text-xs text-white hover:bg-white/5">
            {smart === "contact" ? "Other actions" : "Contact seller"}
          </a>
          <a href={requestInfoHref} className="rounded-lg border border-white/20 px-3 py-2 text-center text-xs text-white hover:bg-white/5">
            Request documents
          </a>
        </div>
        <a href={saveHref} className="block w-full rounded-lg border border-white/15 px-4 py-2 text-center text-sm text-white hover:bg-white/5">
          Save deal
        </a>
      </div>

      {openFactor ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="factor-detail-title"
          onClick={() => setOpenFactorId(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-white/10 bg-[#121214] p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 id="factor-detail-title" className="text-sm font-semibold text-white">
                Factor detail
              </h3>
              <button
                type="button"
                onClick={() => setOpenFactorId(null)}
                className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-200">{openFactor.label}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Explanation</p>
            <p className="mt-1 text-sm text-slate-300">{openFactor.explanation}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Impact</p>
            <p className="mt-1 text-sm text-slate-300">{openFactor.impactNote}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Data source</p>
            <p className="mt-1 text-sm text-slate-400">{openFactor.dataSource}</p>
            <button
              type="button"
              onClick={() => setOpenFactorId(null)}
              className="mt-4 w-full rounded-lg border border-white/20 py-2 text-sm text-white hover:bg-white/5"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
