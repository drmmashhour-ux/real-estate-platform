import React from "react";
import Link from "next/link";
import { Leaf, Info, TrendingUp, Search, ArrowRight, DollarSign, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
/**
 * What we know about this listing — from search decoration, ranking, or your own API.
 * All fields optional; the card fills in plain-language copy from whatever is present.
 */
export type GreenDecisionSignals = {
  label?: "GREEN" | "IMPROVABLE" | "LOW" | null;
  improvementPotential?: "high" | "medium" | "low" | null;
  scoreDelta?: number | null;
  /** Illustrative $ from matched help programs — not a guarantee. */
  estimatedIncentives?: number | null;
  hasPotentialIncentives?: boolean;
  currentScore?: number | null;
  projectedScore?: number | null;
  incentiveStrength?: "high" | "medium" | "low" | null;
};

export type GreenDecisionEconomics = {
  /** Illustrative annual savings after realistic upgrades, CAD */
  annualSavingsMinCad?: number;
  annualSavingsMaxCad?: number;
  /** One-line context shown under savings (plain language) */
  savingsSummary?: string;
};

export type GreenDecisionCardProps = {
  quebecLabel: string;
  rationale: string[];
  signals: GreenDecisionSignals;
  economics?: GreenDecisionEconomics;
  /** Override auto verdict if you already computed copy elsewhere */
  verdictOverride?: string;
  improvementIdeasHref?: string;
  compareSimilarHref?: string;
  onSeeImprovementIdeas?: () => void;
  onCompareSimilar?: () => void;
  className?: string;
};

function formatCurrencyCad(n: number): string {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

function improvementPotentialLabel(p: "high" | "medium" | "low" | null | undefined): string {
  if (p === "high") return "high";
  if (p === "medium") return "medium";
  if (p === "low") return "low";
  return "unclear for now";
}

/**
 * Simple verdict lines — no jargon, buyer-first.
 */
function deriveVerdict(
  signals: GreenDecisionSignals,
  economics: GreenDecisionEconomics | undefined,
): string {
  if (signals.label === "GREEN" && (signals.improvementPotential === "low" || (signals.scoreDelta != null && signals.scoreDelta < 8))) {
    return "Already optimized home";
  }
  const hasSavings =
    (economics?.annualSavingsMinCad != null && economics?.annualSavingsMaxCad != null) ||
    (signals.estimatedIncentives != null && signals.estimatedIncentives > 0) ||
    signals.hasPotentialIncentives === true;

  if (hasSavings && signals.improvementPotential !== "low") {
    return "Potential for cost savings";
  }
  if (signals.improvementPotential === "high" || signals.improvementPotential === "medium" || signals.label === "IMPROVABLE") {
    return "Good opportunity to improve efficiency";
  }
  if (signals.label === "GREEN") {
    return "Already optimized home";
  }
  return "Good opportunity to improve efficiency";
}

/**
 * Build an illustrative annual savings *range* for buyers, without technical terms.
 */
function deriveSavingsRangeText(
  signals: GreenDecisionSignals,
  economics: GreenDecisionEconomics | undefined,
): string | null {
  if (economics?.annualSavingsMinCad != null && economics?.annualSavingsMaxCad != null) {
    const a = Math.min(economics.annualSavingsMinCad, economics.annualSavingsMaxCad);
    const b = Math.max(economics.annualSavingsMinCad, economics.annualSavingsMaxCad);
    if (a === b) {
      return `You could see on the order of ${formatCurrencyCad(a)} a year in lower bills (estimate).`;
    }
    return `You could see on the order of ${formatCurrencyCad(a)} to ${formatCurrencyCad(b)} a year in lower bills (estimate).`;
  }
  if (typeof signals.estimatedIncentives === "number" && signals.estimatedIncentives > 0) {
    const mid = signals.estimatedIncentives;
    const low = Math.max(0, Math.round(mid * 0.75));
    const high = Math.round(mid * 1.25);
    return `Help and upgrades might add up to about ${formatCurrencyCad(low)} to ${formatCurrencyCad(high)} in support (illustrative).`;
  }
  if (signals.scoreDelta != null && signals.scoreDelta >= 10) {
    return "No dollar range yet, but the gap between today and a smarter setup looks meaningful here.";
  }
  return null;
}

export function GreenDecisionCard({
  quebecLabel,
  rationale,
  signals,
  economics,
  verdictOverride,
  improvementIdeasHref,
  compareSimilarHref,
  onSeeImprovementIdeas,
  onCompareSimilar,
  className,
}: GreenDecisionCardProps) {
  const verdict = verdictOverride ?? deriveVerdict(signals, economics);
  const savingsText = deriveSavingsRangeText(signals, economics);
  const imp = improvementPotentialLabel(signals.improvementPotential);
  const topRationale = rationale.filter((r) => r.trim().length > 0).slice(0, 3);

  const primaryBtnClass =
    "w-full h-12 inline-flex items-center justify-center gap-2 bg-[#22c55e] text-black font-black text-xs tracking-widest uppercase rounded-xl hover:scale-[1.02] transition-transform";
  const secondaryBtnClass =
    "w-full h-12 inline-flex items-center justify-center gap-2 border border-white/10 text-white font-black text-xs tracking-widest uppercase rounded-xl hover:bg-white/5";

  return (
    <Card className={`bg-zinc-900/40 border-[#22c55e]/30 border-2 rounded-[3rem] overflow-hidden shadow-2xl relative ${className ?? ""}`}>
      <CardHeader className="p-10 border-b border-white/5 bg-gradient-to-r from-[#22c55e]/10 via-[#0d0d0d] to-transparent backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 shrink-0 bg-[#22c55e]/15 rounded-2xl flex items-center justify-center border border-[#22c55e]/30 shadow-[0_0_32px_rgba(34,197,94,0.18)]">
              <Leaf className="w-7 h-7 text-[#22c55e]" />
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight text-white">Your green snapshot</CardTitle>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Plain-language read on this home</p>
            </div>
          </div>
          <Badge variant="gold" className="shrink-0 bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/30 font-black text-[10px]">
            {quebecLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-10 space-y-8">
        {/* Section 1 — Simple verdict */}
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6 space-y-2">
          <h4 className="text-[10px] font-black text-[#4ade80] uppercase tracking-[0.2em]">What it means for you</h4>
          <p className="text-2xl md:text-[1.65rem] font-black text-white leading-tight">&ldquo;{verdict}&rdquo;</p>
        </div>

        {/* Section 2 — Impact */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Impact</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl border border-blue-500/20 min-h-[120px]">
              <DollarSign className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Possible savings (range)</p>
                <p className="text-sm font-semibold text-white/95 leading-relaxed mt-1">
                  {savingsText ?? "We need a bit more detail to show a dollar range — the direction still matters."}
                </p>
                {economics?.savingsSummary && <p className="text-xs text-white/60 mt-2 leading-relaxed">{economics.savingsSummary}</p>}
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-[#22c55e]/10 to-transparent rounded-2xl border border-[#22c55e]/25 min-h-[120px]">
              <TrendingUp className="w-5 h-5 text-[#4ade80] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Improvement headroom</p>
                <p className="text-base font-bold text-white mt-1">Potential improvement: {imp}</p>
                {signals.scoreDelta != null && signals.scoreDelta >= 8 && (
                  <p className="text-xs text-white/50 mt-2">There’s still a clear gap between where this home is today and where it could be with the right updates.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 — Why */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#22c55e]" />
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Why we say that</h4>
          </div>
          <ul className="space-y-3">
            {topRationale.length === 0 && (
              <li className="text-sm text-white/50 italic pl-1">We&apos;ll add plain reasons as soon as more details are in.</li>
            )}
            {topRationale.map((line) => (
              <li
                key={line.slice(0, 64)}
                className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/8 hover:border-[#22c55e]/20 transition-colors"
              >
                <span className="mt-1.5 h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0" />
                <span className="text-sm text-white/90 font-medium leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 4 — Action */}
        <div className="pt-2 border-t border-white/5 flex flex-col gap-3">
          {improvementIdeasHref ? (
            <Link href={improvementIdeasHref} className={primaryBtnClass}>
              See improvement ideas
              <Search className="w-4 h-4" aria-hidden />
            </Link>
          ) : (
            <Button type="button" className={primaryBtnClass} onClick={onSeeImprovementIdeas}>
              See improvement ideas
              <Search className="w-4 h-4" />
            </Button>
          )}
          {compareSimilarHref ? (
            <Link href={compareSimilarHref} className={secondaryBtnClass}>
              Compare with similar homes
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          ) : (
            <Button type="button" variant="outline" className={secondaryBtnClass} onClick={onCompareSimilar}>
              Compare with similar homes
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 justify-center">
          <Info className="w-3 h-3 text-gray-600 shrink-0" />
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center leading-relaxed">
            Estimates for planning, not a promise. Not an official home rating.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
