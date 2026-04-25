"use client";

import { useCallback, useEffect, useState } from "react";
import { CapitalAllocationPanel } from "./CapitalAllocationPanel";
import { ExpansionOpportunitiesPanel } from "./ExpansionOpportunitiesPanel";
import { InvestorAlertsFeed } from "./InvestorAlertsFeed";
import { InvestorSummaryCards } from "./InvestorSummaryCards";
import { RoiPerformanceTable } from "./RoiPerformanceTable";
import { ScenarioSimulatorPanel } from "./ScenarioSimulatorPanel";
import { InvestorCorporateStrategyBlurb } from "./InvestorCorporateStrategyBlurb";
import type { CapitalAllocationView, InvestorSnapshotView, InvestorAlert, RoiInsight, InvestmentOpportunity, MarketExpansionCandidate, InvestmentRisk } from "@/modules/investor-intelligence/investor-intelligence.types";

type Overview = {
  snapshot: InvestorSnapshotView & { capitalAllocationJson: CapitalAllocationView[] };
  expansion: {
    topMarkets: MarketExpansionCandidate[];
    topSegments: InvestmentOpportunity[];
    risks: InvestmentRisk[];
    capacityNotes: string[];
  };
  alerts: InvestorAlert[];
  roiSample: RoiInsight[];
  disclaimer: string;
};

type Props = { className?: string };

export function InvestorDashboard({ className }: Props) {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/investor/overview", { credentials: "include" });
      const j = (await res.json()) as Overview & { ok?: boolean; featureDisabled?: boolean; message?: string; error?: string };
      if (!j.ok) {
        setErr(j.error ?? "Could not load");
        return;
      }
      if (j.featureDisabled) {
        setErr(j.message ?? "Feature disabled");
        return;
      }
      if (j.snapshot) setData({ snapshot: j.snapshot as Overview["snapshot"], expansion: j.expansion!, alerts: j.alerts!, roiSample: j.roiSample! ?? [], disclaimer: j.disclaimer });
    } catch {
      setErr("Network error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) {
    return (
      <div className={className}>
        <p className="text-sm text-amber-800">{err}</p>
        <button type="button" onClick={load} className="mt-2 text-sm text-slate-600 underline">
          Retry
        </button>
      </div>
    );
  }
  if (!data) {
    return <p className="text-slate-500">Loading…</p>;
  }
  const a = (data.snapshot.capitalAllocationJson as unknown as CapitalAllocationView[]) ?? [];
  return (
    <div className={className} data-testid="investor-intel-dashboard">
      <p className="mb-2 text-xs text-slate-500" role="note">
        {data.disclaimer}
      </p>
      <InvestorSummaryCards
        totalRevenue={data.snapshot.totalRevenue}
        wonDeals={data.snapshot.totalWonDeals}
        pipeline={data.snapshot.estimatedPipelineValue}
        leadSpend={data.snapshot.totalLeadSpend}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RoiPerformanceTable rows={data.roiSample} />
        <InvestorAlertsFeed alerts={data.alerts} />
        <CapitalAllocationPanel recs={a} />
        <ExpansionOpportunitiesPanel
          markets={data.expansion.topMarkets}
          segments={data.expansion.topSegments}
          risks={data.expansion.risks}
          capacity={data.expansion.capacityNotes}
        />
      </div>
      <div className="mt-6">
        <ScenarioSimulatorPanel />
      </div>
      <div className="mt-6 border-t border-slate-200 pt-4">
        <InvestorCorporateStrategyBlurb />
      </div>
    </div>
  );
}
