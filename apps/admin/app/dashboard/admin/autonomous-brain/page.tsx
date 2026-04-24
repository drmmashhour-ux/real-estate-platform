"use client";

import { useCallback, useEffect, useState } from "react";

import { LearningPatternTable } from "@/components/learning/LearningPatternTable";
import { InvestmentOpportunityTable } from "@/components/investment/InvestmentOpportunityTable";
import { MarketplaceOptimizationQueue } from "@/components/marketplace/MarketplaceOptimizationQueue";
import { AdminCommandBar } from "@/components/admin/AdminCommandBar";
import { Card } from "@/components/ui/Card";

type PriorityItem = {
  domain: string;
  id: string;
  title: string;
  priorityScore: number;
  whyNow: string;
  expectedValue: string;
  suggestedNextStep: string;
  explainability: {
    dataSources: string[];
    confidence: number | null;
    advisoryOnly: boolean;
    prioritizationFactors: string[];
  };
};

type OutcomeRecent = {
  decisionId: string;
  domain: string;
  action: string;
  proposalType: string;
  appliedAt: string | null;
  metrics: Array<{
    metric: string;
    delta: number | null;
    note?: string;
  }>;
};

export default function AutonomousBrainControlCenterPage() {
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeRecent[]>([]);
  const [outcomeSummary, setOutcomeSummary] = useState<{
    implementedCount: number;
    improvedConversionCount: number;
    lastUpdated: string | null;
  } | null>(null);
  const [banner, setBanner] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/autonomous-brain/summary");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "summary_failed");
        return;
      }
      setBanner(typeof data.advisoryBanner === "string" ? data.advisoryBanner : "");
      setPriorities((data.priorities ?? []) as PriorityItem[]);
      setOutcomes((data.outcomes?.recent ?? []) as OutcomeRecent[]);
      setOutcomeSummary(data.outcomes?.summary ?? null);
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <AdminCommandBar title="Autonomous Brain · Control Center" />

      <Card variant="alert" className="space-y-2">
        <p className="text-sm font-semibold text-amber-50">Advisory posture</p>
        <p className="text-sm text-amber-100/95">
          {banner ||
            "Human review first: surfaced items combine learning, investment snapshots, and governed marketplace optimizations. Nothing here executes trades or overrides compliance gates automatically."}
        </p>
      </Card>

      {error ?
        <p className="text-sm text-red-700">{error}</p>
      : null}
      {loading ?
        <p className="text-sm text-[#5C5C57]">Loading cross-domain summary…</p>
      : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B0B0B]">Priority queue</h2>
        <p className="text-sm text-[#5C5C57]">
          Rank blends potential impact, confidence, urgency (approval friction), and evidence quality. Each card
          states why it surfaced and whether it is advisory-only.
        </p>
        {!loading && priorities.length === 0 ?
          <p className="text-sm text-[#5C5C57]">No ranked items yet.</p>
        : null}
        <div className="space-y-3">
          {priorities.map((p) => (
            <Card key={`${p.domain}-${p.id}`} variant="dashboardPanel" className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-[#0B0B0B]">{p.title}</p>
                <span className="rounded-full bg-[#FAFAF7] px-2 py-0.5 text-xs uppercase text-[#5C5C57]">
                  {p.domain.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm text-[#5C5C57]">
                <span className="font-medium text-[#0B0B0B]">Why now:</span> {p.whyNow}
              </p>
              <p className="text-sm text-[#5C5C57]">
                <span className="font-medium text-[#0B0B0B]">Expected value:</span> {p.expectedValue}
              </p>
              <p className="text-sm text-[#5C5C57]">
                <span className="font-medium text-[#0B0B0B]">Next step:</span> {p.suggestedNextStep}
              </p>
              <p className="text-xs text-[#5C5C57]">
                Confidence:{" "}
                {p.explainability.confidence != null ?
                  `${(p.explainability.confidence * 100).toFixed(0)}%`
                : "n/a"}{" "}
                · Advisory: {p.explainability.advisoryOnly ? "yes" : "review"} · Sources:{" "}
                {p.explainability.dataSources.join("; ")}
              </p>
              <p className="text-xs text-[#8A8A84]">
                Priority score {p.priorityScore.toFixed(3)} — factors: {p.explainability.prioritizationFactors.join(", ")}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <LearningPatternTable />

      <InvestmentOpportunityTable />

      <MarketplaceOptimizationQueue />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B0B0B]">Outcome tracking</h2>
        <p className="text-sm text-[#5C5C57]">
          Compares autonomy baseline vs post-apply snapshots on implemented proposals. Revenue figures are proxies
          unless reconciled with finance systems.
        </p>
        {outcomeSummary ?
          <Card variant="stat" className="text-sm text-white">
            <p>
              Implemented decisions (sample):{" "}
              <span className="font-semibold">{outcomeSummary.implementedCount}</span> · Improved conversion signals:{" "}
              <span className="font-semibold">{outcomeSummary.improvedConversionCount}</span>
            </p>
            {outcomeSummary.lastUpdated ?
              <p className="mt-1 text-xs text-white/70">Latest apply: {outcomeSummary.lastUpdated}</p>
            : null}
          </Card>
        : null}

        <div className="space-y-3">
          {outcomes.map((o) => (
            <Card key={o.decisionId} variant="dashboardPanel" className="space-y-2 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold text-[#0B0B0B]">
                  {o.domain}: {o.action}
                </p>
                <span className="text-xs text-[#5C5C57]">{o.appliedAt}</span>
              </div>
              <p className="text-[#5C5C57]">
                Proposal type: <span className="text-[#0B0B0B]">{o.proposalType}</span>
              </p>
              <ul className="list-inside list-disc text-[#5C5C57]">
                {o.metrics.slice(0, 4).map((m) => (
                  <li key={m.metric}>
                    <span className="font-medium text-[#0B0B0B]">{m.metric}</span> Δ{" "}
                    {m.delta != null ? m.delta.toFixed(4) : "n/a"} — {m.note}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <button
          type="button"
          className="text-sm font-medium text-premium-gold underline-offset-4 hover:underline"
          onClick={() => void loadSummary()}
        >
          Refresh outcomes
        </button>
      </section>
    </div>
  );
}
