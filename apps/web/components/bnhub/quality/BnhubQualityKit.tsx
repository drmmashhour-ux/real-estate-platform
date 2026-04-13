import type { ReactNode } from "react";

export function StarRatingBadge({ stars, label }: { stars: number; label?: string }) {
  const s = Math.max(0, Math.min(5, Math.round(stars)));
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 text-xs text-amber-100">
      <span aria-hidden>{"★".repeat(s)}{"☆".repeat(5 - s)}</span>
      {label ? <span className="text-[10px] text-amber-200/80">{label}</span> : null}
    </span>
  );
}

export function LuxuryTierBadge({ code }: { code: string }) {
  if (!code || code === "NONE") return null;
  const tone =
    code === "ELITE"
      ? "border-violet-400/50 text-violet-100"
      : code === "PREMIUM"
        ? "border-emerald-400/50 text-emerald-100"
        : "border-sky-400/50 text-sky-100";
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
      BNHUB {code.toLowerCase()}
    </span>
  );
}

export function TrustScoreCard(props: {
  trustScore: number;
  riskLevel: string;
  safeMessage: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-200">
      <p className="text-xs font-medium text-slate-400">Trust summary</p>
      <p className="mt-1 text-lg font-semibold text-white">{props.trustScore}</p>
      <p className="text-xs text-slate-500">Risk band: {props.riskLevel}</p>
      <p className="mt-2 text-xs text-slate-400">{props.safeMessage}</p>
      {props.children}
    </div>
  );
}

export function FraudRiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    LOW: "bg-slate-800 text-slate-300",
    MEDIUM: "bg-amber-900/40 text-amber-200",
    HIGH: "bg-orange-900/40 text-orange-200",
    CRITICAL: "bg-red-900/40 text-red-200",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${map[level] ?? map.LOW}`}>
      {level}
    </span>
  );
}

export function PricingRecommendationCard(props: {
  recommendedUsd: string;
  minUsd: string;
  maxUsd: string;
  confidence: number;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3 text-sm">
      <p className="text-xs font-medium text-emerald-400">Pricing recommendation</p>
      <p className="mt-1 text-xl font-semibold text-white">${props.recommendedUsd} / night</p>
      <p className="text-xs text-slate-500">
        Guardrails ${props.minUsd} — ${props.maxUsd} · Confidence {props.confidence}%
      </p>
      <p className="mt-2 text-xs text-slate-400">{props.note}</p>
    </div>
  );
}

export function ImprovementSuggestionsList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="list-inside list-disc text-xs text-slate-400">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

export function EligibilityChecklist({ title, items }: { title: string; items: { ok: boolean; text: string }[] }) {
  return (
    <div className="rounded-lg border border-slate-800 p-3">
      <p className="text-xs font-medium text-slate-300">{title}</p>
      <ul className="mt-2 space-y-1 text-xs">
        {items.map((x) => (
          <li key={x.text} className={x.ok ? "text-emerald-400" : "text-slate-500"}>
            {x.ok ? "✓ " : "○ "}
            {x.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TierUpgradeCard({ suggestions }: { suggestions: string[] }) {
  return (
    <div className="rounded-xl border border-violet-900/40 bg-violet-950/20 p-3">
      <p className="text-xs font-medium text-violet-300">Tier upgrade ideas</p>
      <ImprovementSuggestionsList items={suggestions} />
    </div>
  );
}

export function RiskReviewPanel(props: { summary: string; evidenceNote: string }) {
  return (
    <div className="rounded-xl border border-orange-900/40 bg-orange-950/20 p-3 text-xs text-orange-100">
      <p className="font-semibold">Moderation</p>
      <p className="mt-1 text-orange-200/90">{props.summary}</p>
      <p className="mt-2 text-[10px] text-orange-300/70">{props.evidenceNote}</p>
    </div>
  );
}
