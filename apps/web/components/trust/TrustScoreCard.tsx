"use client";

import type { TrustLevel } from "@/modules/trust/trust.types";

type Props = {
  score: number;
  level: TrustLevel;
  confidence: "low" | "medium" | "high";
  variant?: "default" | "compact";
};

const LEVEL_LABEL: Record<TrustLevel, string> = {
  low: "Building trust",
  medium: "Fair standing",
  high: "Strong trust signals",
  verified: "Elevated verification",
  premium: "Highest tier (earned)",
};

export function TrustScoreCard({ score, level, confidence, variant = "default" }: Props) {
  const compact = variant === "compact";
  return (
    <section
      className={`rounded-xl border border-premium-gold/20 bg-black/35 ${compact ? "px-3 py-3" : "px-4 py-4"} text-sm text-[#e5e5e5]`}
      aria-label="Trust score"
    >
      <p className={`font-semibold text-premium-gold ${compact ? "text-xs" : "text-sm"}`}>Trust index</p>
      <div className={`mt-2 flex flex-wrap items-baseline gap-2 ${compact ? "" : ""}`}>
        <span className={`font-bold tracking-tight text-white ${compact ? "text-2xl" : "text-3xl"}`}>{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#737373]">/ 100</span>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-premium-gold">
          {LEVEL_LABEL[level]}
        </span>
      </div>
      <p className={`mt-2 ${compact ? "text-[11px]" : "text-xs"} leading-relaxed text-[#9CA3AF]`}>
        Confidence: <span className="text-[#D1D5DB]">{confidence}</span>. This index combines verification and checklist
        signals — not a legal determination.
      </p>
    </section>
  );
}
