"use client";

import { useMemo } from "react";
import { Leaf, Lock, Sparkles, TrendingUp, BarChart3, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { GreenSearchResultDecoration } from "@/modules/green-ai/green-search.types";
import { getGreenOpportunityBucket, greenDiscoveryLine, GREEN_COPY } from "@/modules/green-ai/green-discovery-copy.service";

export type GreenBrokerValuePanelProps = {
  /** From {@link decorateListingWithGreenSignals} — reuses same intelligence layer as search. */
  decoration: GreenSearchResultDecoration;
  /** When false, advanced rows are masked and the upsell is shown. */
  isPremiumGreen: boolean;
  /** FSBO: buyer-attraction framing + extra suggestion lines. */
  isFsbo?: boolean;
  /** Enables comparison: this listing vs a similar one (e.g. comp set). */
  peerDecoration?: GreenSearchResultDecoration;
  selfLabel?: string;
  peerLabel?: string;
  onUnlockFullAnalysis?: () => void;
  className?: string;
};

type ValuePill = { id: "improve" | "resale" | "undervalued"; line: string; active: boolean };

function deriveValuePills(d: GreenSearchResultDecoration): ValuePill[] {
  const delta = d.scoreDelta ?? (d.currentScore != null && d.projectedScore != null ? d.projectedScore - d.currentScore : 0);
  const canImprove =
    d.label === "IMPROVABLE" || d.improvementPotential === "high" || d.improvementPotential === "medium";
  const higherResale =
    (delta != null && delta >= 8) || d.improvementPotential === "high" || (d.currentScore != null && d.currentScore >= 70 && (delta ?? 0) >= 5);
  const headroom =
    d.currentScore != null &&
    d.projectedScore != null &&
    d.projectedScore - d.currentScore >= 10 &&
    d.currentScore < 72;
  const boost = d.rankingBoostSuggestion != null && d.rankingBoostSuggestion > 1.03;
  const undervalued = headroom || boost;
  const any = canImprove || higherResale || undervalued;

  return [
    { id: "improve", line: "This listing can be improved", active: canImprove || !any },
    { id: "resale", line: "Higher resale potential", active: higherResale },
    { id: "undervalued", line: "Undervalued vs market", active: undervalued },
  ];
}

function improvementLabel(p: "high" | "medium" | "low" | null | undefined): string {
  if (p === "high") return "High";
  if (p === "medium") return "Medium";
  if (p === "low") return "Low";
  return "—";
}

function opportunityBucketLabel(bucket: ReturnType<typeof getGreenOpportunityBucket>): { title: string; detail: string } {
  switch (bucket) {
    case "top_current":
      return { title: "Strong current position", detail: "Priority for buyers valuing today’s performance." };
    case "upgrade":
      return { title: "Upgrade path", detail: "Meaningful modeled uplift — good story for value-add." };
    case "incentives":
      return { title: "Incentive stack (verify)", detail: "Illustrative programs detected — reconfirm eligibility." };
    case "mixed":
      return { title: "Mixed signals", detail: "Some green value present; refine data for tighter pitch." };
    default:
      return { title: "Unknown / sparse data", detail: "Add green fields to improve modeling." };
  }
}

/**
 * Premium broker-facing green value: monetization story + optional peer comparison, gated by `isPremiumGreen`.
 * Reuses {@link GreenSearchResultDecoration} (same as search decoration + opportunity buckets from {@link getGreenOpportunityBucket}).
 */
export function GreenBrokerValuePanel({
  decoration,
  isPremiumGreen,
  isFsbo = false,
  peerDecoration,
  selfLabel = "This listing",
  peerLabel = "Similar listing",
  onUnlockFullAnalysis,
  className,
}: GreenBrokerValuePanelProps) {
  const pills = useMemo(() => deriveValuePills(decoration), [decoration]);
  const bucket = useMemo(() => getGreenOpportunityBucket(decoration), [decoration]);
  const peerBucket = useMemo(
    () => (peerDecoration ? getGreenOpportunityBucket(peerDecoration) : null),
    [peerDecoration],
  );
  const blurb = useMemo(() => greenDiscoveryLine(decoration, "card"), [decoration]);
  const fsboSuggestions = useMemo(() => {
    const fromRationale = decoration.rationale.slice(0, 4);
    const fromCallouts = decoration.brokerCallouts.slice(0, 2);
    const merge = [...new Set([...fromRationale, ...fromCallouts])].filter(Boolean);
    return merge.length
      ? merge
      : [
          "Add heating + envelope details to raise modeled scores.",
          "Document upgrades so projected performance can be shown.",
        ];
  }, [decoration]);

  return (
    <Card
      className={cn("overflow-hidden border border-emerald-500/20 bg-zinc-950/60 shadow-xl backdrop-blur", className)}
    >
      <CardHeader className="border-b border-emerald-500/10 bg-emerald-500/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/80">Green value (broker)</p>
              <CardTitle className="text-base font-semibold text-white">Intelligence for better listings & faster trust</CardTitle>
            </div>
          </div>
          {isPremiumGreen ? (
            <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-200">
              <Sparkles className="mr-1 h-3 w-3" />
              Full analysis
            </Badge>
          ) : (
            <Badge variant="outline" className="text-zinc-300">
              <Lock className="mr-1 h-3 w-3" />
              Preview
            </Badge>
          )}
        </div>
        <p className="mt-2 text-xs text-zinc-400">{GREEN_COPY.disclaimerShort}</p>
      </CardHeader>
      <CardContent className="space-y-6 p-5">
        {/* Value — always on (perceived value) */}
        <section>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Value signals</h4>
          <ul className="mt-2 space-y-2">
            {pills.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  p.active
                    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-50"
                    : "border-zinc-800/80 bg-zinc-900/30 text-zinc-500",
                )}
              >
                <TrendingUp className={cn("h-4 w-4 shrink-0", p.active ? "text-emerald-400" : "text-zinc-600")} />
                {p.line}
              </li>
            ))}
          </ul>
        </section>

        {isFsbo && (
          <section className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-4">
            <div className="flex items-center gap-2 text-sky-200">
              <Home className="h-4 w-4" />
              <h4 className="text-sm font-semibold">FSBO: improve the listing to attract buyers</h4>
            </div>
            <p className="mt-1 text-xs text-sky-100/80">
              Use the modeled green levers below as talking points; verify facts before you publish.
            </p>
            <ul className="mt-2 list-inside list-disc text-xs text-sky-100/90">
              {fsboSuggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Teaser (everyone) */}
        <p className="text-sm text-zinc-300">{blurb}</p>

        {!isPremiumGreen && (
          <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-amber-100">Unlock full green analysis</p>
              {onUnlockFullAnalysis ? (
                <Button
                  type="button"
                  size="sm"
                  className="bg-amber-500/90 text-black hover:bg-amber-400"
                  onClick={onUnlockFullAnalysis}
                >
                  Upgrade
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-200/80">
                  <Lock className="h-3.5 w-3.5" />
                  Contact ops / subscription
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-amber-200/60">Scores détaillés, comp set vert, pépinière d’opportunités, boost discovery.</p>
          </div>
        )}

        <div
          className={cn(
            "space-y-4 transition",
            !isPremiumGreen && "pointer-events-none max-h-[200px] select-none opacity-[0.22] blur-[3px] grayscale",
          )}
        >
          <section>
            <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <BarChart3 className="h-3.5 w-3.5" />
              Scores &amp; opportunity (internal)
            </h4>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-zinc-800 bg-black/30 p-3">
                <p className="text-[10px] uppercase text-zinc-500">Green score (now)</p>
                <p className="mt-0.5 font-mono text-lg text-white">{decoration.currentScore ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-black/30 p-3">
                <p className="text-[10px] uppercase text-zinc-500">Projected</p>
                <p className="mt-0.5 font-mono text-lg text-emerald-200/90">{decoration.projectedScore ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-black/30 p-3">
                <p className="text-[10px] uppercase text-zinc-500">Improvement (modeled)</p>
                <p className="mt-0.5 text-sm text-white">{improvementLabel(decoration.improvementPotential)}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-black/30 p-3">
                <p className="text-[10px] uppercase text-zinc-500">Rank assist</p>
                <p className="mt-0.5 text-sm text-zinc-200">
                  {decoration.rankingBoostSuggestion != null
                    ? `${(decoration.rankingBoostSuggestion * 100 - 100).toFixed(1)}%`
                    : "—"}
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-zinc-800/80 p-3">
              <p className="text-[10px] font-semibold uppercase text-zinc-500">Opportunity bucket</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">{opportunityBucketLabel(bucket).title}</p>
              <p className="text-xs text-zinc-400">{opportunityBucketLabel(bucket).detail}</p>
            </div>
            {decoration.brokerCallouts.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs text-amber-100/80">
                {decoration.brokerCallouts.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}
          </section>

          {peerDecoration && (
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Compare to similar (green)</h4>
              <div className="mt-2 grid gap-0 overflow-hidden rounded-xl border border-zinc-800 sm:grid-cols-2">
                <div className="space-y-2 border-b border-zinc-800 p-4 sm:border-b-0 sm:border-r">
                  <p className="text-[10px] font-mono text-zinc-500">{selfLabel}</p>
                  <p className="text-xs text-zinc-400">Green score: <span className="font-mono text-white">{decoration.currentScore ?? "—"}</span></p>
                  <p className="text-xs text-zinc-400">
                    Improvement potential:{" "}
                    <span className="text-white">{improvementLabel(decoration.improvementPotential)}</span>{" "}
                    <span className="text-zinc-500">(Δ {decoration.scoreDelta ?? "—"})</span>
                  </p>
                  <p className="text-[10px] text-zinc-500">Bucket: {bucket}</p>
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-[10px] font-mono text-zinc-500">{peerLabel}</p>
                  <p className="text-xs text-zinc-400">Green score: <span className="font-mono text-white">{peerDecoration.currentScore ?? "—"}</span></p>
                  <p className="text-xs text-zinc-400">
                    Improvement potential:{" "}
                    <span className="text-white">{improvementLabel(peerDecoration.improvementPotential)}</span>{" "}
                    <span className="text-zinc-500">(Δ {peerDecoration.scoreDelta ?? "—"})</span>
                  </p>
                  <p className="text-[10px] text-zinc-500">Bucket: {peerBucket}</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {!isPremiumGreen && (
          <p className="text-center text-[10px] text-zinc-500">Unlock to justify premium placement &amp; full broker pitch data.</p>
        )}
      </CardContent>
    </Card>
  );
}
