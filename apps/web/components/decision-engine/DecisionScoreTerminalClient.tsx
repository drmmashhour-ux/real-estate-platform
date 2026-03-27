"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import type { DecisionSnapshot } from "@/lib/decision-engine/buildDecisionSnapshot";
import type { FraudScoreResult } from "@/modules/fraud-risk/domain/fraud.types";
import type { DealRecommendationBand } from "@/modules/deal-score/domain/dealScore.types";
import { bandAccent, confidenceTier, scoreToVisualBand } from "@/lib/decision-engine/scoreVisual";
import { buildDecisionActions } from "@/components/decision-engine/decisionActionLinks";
import { Button } from "@/components/ui/Button";

type Props = {
  listingId: string;
  initial: DecisionSnapshot;
  dealReasons: string[];
  fraud: FraudScoreResult | null;
};

function recLabel(r: DealRecommendationBand): string {
  switch (r) {
    case "strong_opportunity":
      return "Strong opportunity";
    case "worth_reviewing":
      return "Worth reviewing";
    case "caution":
      return "Caution";
    case "avoid":
      return "Avoid / overpriced";
    case "insufficient_data":
      return "Insufficient data";
    default:
      return "Neutral";
  }
}

function recBadgeClass(r: DealRecommendationBand): string {
  switch (r) {
    case "strong_opportunity":
      return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
    case "worth_reviewing":
      return "bg-emerald-900/40 text-emerald-100 border-emerald-600/30";
    case "caution":
      return "bg-amber-500/15 text-amber-100 border-amber-500/35";
    case "avoid":
      return "bg-red-500/15 text-red-200 border-red-500/35";
    default:
      return "bg-zinc-800 text-zinc-300 border-zinc-600";
  }
}

/** Seller-safe risk tier: low | medium | high (fraud engine may emit critical). */
function riskTierUi(fraud: FraudScoreResult | null): "low" | "medium" | "high" {
  if (!fraud) return "low";
  if (fraud.riskLevel === "critical" || fraud.riskLevel === "high") return "high";
  if (fraud.riskLevel === "medium") return "medium";
  return "low";
}

export function DecisionScoreTerminalClient({ listingId, initial, dealReasons, fraud }: Props) {
  const [snapshot, setSnapshot] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/decision-engine/${listingId}`, { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        trust?: DecisionSnapshot["trust"];
        deal?: DecisionSnapshot["deal"];
        explanation?: DecisionSnapshot["explanation"];
      };
      if (!res.ok || !json.trust || !json.deal || !json.explanation) {
        throw new Error(json.error ?? "Failed to recompute");
      }
      setSnapshot({ trust: json.trust, deal: json.deal, explanation: json.explanation });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  const { trust, deal, explanation } = snapshot;

  const trustBand = scoreToVisualBand(trust.trustScore, trust.level);
  const dealBand = scoreToVisualBand(deal.dealScore);
  const trustA = bandAccent(trustBand);
  const dealA = bandAccent(dealBand);

  const trustConf = confidenceTier(trust.trustConfidence);
  const dealConf = confidenceTier(deal.dealConfidence);

  const positives = trust.strengths.slice(0, 3);
  const issues = trust.issues.slice(0, 3);
  const topReasons = (dealReasons.length ? dealReasons : deal.warnings ?? []).slice(0, 4);
  const actions = buildDecisionActions(listingId, snapshot);

  const riskLevel = riskTierUi(fraud);
  const reviewNeeded = fraud?.reviewRecommended === true;
  const riskBorder =
    riskLevel === "high"
      ? "border-red-500/40 ring-1 ring-red-500/20"
      : riskLevel === "medium"
        ? "border-amber-500/40 ring-1 ring-amber-500/15"
        : "border-emerald-900/50 ring-1 ring-emerald-900/30";

  const chips = [
    ...trust.issueCodes.slice(0, 8),
    ...(fraud?.signals.map((s) => s.code) ?? []).slice(0, 6),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="space-y-4 font-mono text-[12px] leading-relaxed text-zinc-300">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">LECIPM</p>
          <p className="text-sm font-semibold text-zinc-100">Decision terminal</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 border-zinc-700 bg-zinc-900/80 text-[11px] text-zinc-200"
          onClick={() => void refresh()}
          disabled={loading}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Recompute
        </Button>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 ${trustA.ring}`}>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Trust score</p>
          <p className={`mt-1 text-4xl font-bold tabular-nums ${trustA.text}`}>{trust.trustScore}</p>
          <p className={`mt-0.5 text-[11px] ${trustA.label}`}>
            {trust.trustScore} / {trustConf} confidence
          </p>
          <div className="mt-3 space-y-2 border-t border-zinc-800/80 pt-2">
            <p className="text-[10px] uppercase text-emerald-500/90">Strongest signals</p>
            <ul className="space-y-1 text-[11px] text-zinc-400">
              {positives.length ? positives.map((p) => <li key={p}>+ {p}</li>) : <li className="text-zinc-600">—</li>}
            </ul>
            <p className="text-[10px] uppercase text-red-400/80">Biggest issues</p>
            <ul className="space-y-1 text-[11px] text-zinc-400">
              {issues.length ? issues.map((p) => <li key={p}>− {p}</li>) : <li className="text-zinc-600">—</li>}
            </ul>
          </div>
        </div>

        <div className={`rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 ${dealA.ring}`}>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Deal score</p>
          <p className={`mt-1 text-4xl font-bold tabular-nums ${dealA.text}`}>{deal.dealScore}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${recBadgeClass(
                deal.recommendation,
              )}`}
            >
              {recLabel(deal.recommendation)}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            {deal.dealScore} / {dealConf} confidence
          </p>
          <div className="mt-3 border-t border-zinc-800/80 pt-2">
            <p className="text-[10px] uppercase text-zinc-500">Top reasons</p>
            <ul className="mt-1 space-y-1 text-[11px] text-zinc-400">
              {topReasons.length ? topReasons.map((r) => <li key={r}>• {r}</li>) : <li className="text-zinc-600">—</li>}
            </ul>
          </div>
        </div>

        <div className={`rounded-lg border bg-zinc-950/80 p-3 ${riskBorder}`}>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Risk</p>
          <p
            className={`mt-2 text-2xl font-bold uppercase ${
              riskLevel === "high" ? "text-red-300" : riskLevel === "medium" ? "text-amber-300" : "text-emerald-300"
            }`}
          >
            {riskLevel}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Fraud score {fraud?.fraudScore ?? 0}</p>
          <div className="mt-3 max-h-28 overflow-y-auto border-t border-zinc-800/80 pt-2">
            <p className="text-[10px] uppercase text-zinc-500">Issue codes</p>
            <ul className="mt-1 flex flex-wrap gap-1">
              {fraud?.signals.length ? (
                fraud.signals.map((s) => (
                  <li
                    key={s.code}
                    className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400"
                    title={s.safeSummary}
                  >
                    {s.code}
                  </li>
                ))
              ) : (
                <li className="text-[11px] text-zinc-600">—</li>
              )}
            </ul>
          </div>
          {reviewNeeded ? (
            <p className="mt-2 rounded border border-amber-600/40 bg-amber-950/30 px-2 py-1.5 text-[11px] text-amber-100">
              Review recommended
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Explanation</p>
        <p className="mt-2 whitespace-pre-wrap text-[12px] text-zinc-300">{explanation.summary}</p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Evidence</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.length ? (
            chips.map((c) => (
              <span
                key={c}
                className="rounded border border-zinc-700/80 bg-zinc-900/80 px-2 py-0.5 text-[10px] text-zinc-400"
              >
                {c}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-zinc-600">No codes</span>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Next actions</p>
        <ul className="mt-3 space-y-2">
          {actions.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-300">{a.label}</span>
              <Link
                href={a.href}
                className="shrink-0 rounded border border-emerald-600/50 bg-emerald-950/40 px-2 py-1 text-[10px] text-emerald-200 hover:bg-emerald-900/50"
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
