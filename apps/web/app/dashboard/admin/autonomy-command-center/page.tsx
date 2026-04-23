"use client";

import { useCallback, useEffect, useState } from "react";

import { AiCeoPanel } from "@/components/autonomy/AiCeoPanel";
import { AlertsPanel } from "@/components/autonomy/AlertsPanel";
import type { ApprovalQueueRow } from "@/components/autonomy/ApprovalQueuePanel";
import { ApprovalQueuePanel } from "@/components/autonomy/ApprovalQueuePanel";
import { AutonomyMetricsPanel } from "@/components/autonomy/AutonomyMetricsPanel";
import type { DomainMatrixRow } from "@/components/autonomy/DomainMatrix";
import { DomainMatrix } from "@/components/autonomy/DomainMatrix";
import { DealIntelligencePanel } from "@/components/autonomy/DealIntelligencePanel";
import { LiveAutonomyFeed } from "@/components/autonomy/LiveAutonomyFeed";
import { MarketingExpansionPanel } from "@/components/autonomy/MarketingExpansionPanel";
import { RevenueGrowthPanel } from "@/components/autonomy/RevenueGrowthPanel";
import { RiskCompliancePanel } from "@/components/autonomy/RiskCompliancePanel";
import { DisputeObservabilityPanel } from "@/components/autonomy/DisputeObservabilityPanel";
import { SystemOverviewStrip } from "@/components/autonomy/SystemOverviewStrip";
import type { DisputeObservabilityMetrics } from "@/modules/disputes/dispute.types";
import { useRouter } from "next/navigation";

type SummaryPayload = {
  advisory?: string;
  selfExpansionHints?: {
    nextBestTerritoryName: string | null;
    topBlocker: string | null;
    bestEntryHub: string | null;
    expansionUrgency: string;
  };
  systemOverview: {
    revenueCentsToday: number | null;
    revenueCentsWeek: number | null;
    revenueCentsMonth: number | null;
    activeDeals: number | null;
    bookingsToday: number | null;
    conversionRate: number | null;
    autonomyStatus: "ON" | "LIMITED" | "OFF";
    highRiskAlertsCount: number;
    revenueNote?: string | null;
    globalPaused: boolean;
  };
  liveAutonomyFeed: Array<{
    id: string;
    domain: string;
    domainLabel: string;
    action: string;
    result: string;
    timestamp: string;
    explanationPreview?: string;
    drilldownHref: string;
  }>;
  domainMatrix: DomainMatrixRow[];
  revenueGrowth: {
    bookingsTrend: number | null;
    conversionTrend: number | null;
    roiSignalsBand?: { linkedRows?: number; note?: string };
    capitalAllocationImpact?: { linkedRows?: number; note?: string };
  };
  dealIntelligence: {
    priorityDeals: Array<{
      id: string;
      dealCode: string | null;
      status: string;
      crmStage: string | null;
      updatedAt: string;
    }>;
    stalledDeals: Array<{
      id: string;
      dealCode: string | null;
      status: string;
      crmStage: string | null;
      updatedAt: string;
    }>;
    highProbabilityDeals: Array<{
      id: string;
      dealCode: string | null;
      status: string;
      crmStage: string | null;
      updatedAt: string;
    }>;
    riskDistribution: Array<{ status: string; count: number }>;
  };
  marketingExpansion: {
    campaignsRunning: number | null;
    seoPagesGenerated: number | null;
    contentCalendarNote?: string | null;
  };
  riskCompliance: {
    blockedActions: number;
    complianceAlerts: number;
    insuranceCoownershipReviewFlags: number | null;
    fraudSignals: Array<{ key: string; count: number }>;
  };
  approvalQueue: ApprovalQueueRow[];
  alertsAndAnomalies: Array<{ kind: string; severity: string; title: string; detail: string }>;
  disputeObservability?: DisputeObservabilityMetrics | null;
  performanceByDomain: Array<{
    uiDomainId: string;
    title: string;
    actionsExecuted: number;
    successRate: number | null;
    failureRate: number | null;
    approvalRatio: number | null;
    roiImpactBand: string;
    timeSavedMinutes: number;
  }>;
};

export default function AutonomyCommandCenterPage() {
  const router = useRouter();
  const [data, setData] = useState<SummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/autonomy-command-center/summary");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j?.error === "string" ? j.error : "summary_failed");
        return;
      }
      setData(j as SummaryPayload);
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function pauseAll(paused: boolean) {
    await fetch("/api/autonomy-command-center/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused, reason: paused ? "command_center_pause" : "command_center_resume" }),
    });
    await load();
  }

  async function quickMode(mode: "ASSIST" | "SAFE" | "FULL") {
    await fetch("/api/autonomy-command-center/quick-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    await load();
  }

  async function approveRow(id: string) {
    await fetch(`/api/full-autopilot/approvals/${id}/approve`, { method: "POST" });
    await load();
  }

  async function rejectRow(id: string) {
    await fetch(`/api/full-autopilot/approvals/${id}/reject`, { method: "POST" });
    await load();
  }

  const ov = data?.systemOverview;

  return (
    <div className="min-h-screen bg-black pb-16 pt-8 text-[#f4efe4]">
      <div className="mx-auto max-w-[1600px] space-y-10 px-4">
        {error ?
          <p className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">{error}</p>
        : null}
        {loading && !data ?
          <p className="text-sm text-[#b8b3a8]">Loading executive autonomy bundle…</p>
        : null}

        {ov ?
          <SystemOverviewStrip
            revenueCentsToday={ov.revenueCentsToday}
            revenueCentsWeek={ov.revenueCentsWeek}
            revenueCentsMonth={ov.revenueCentsMonth}
            activeDeals={ov.activeDeals}
            bookingsToday={ov.bookingsToday}
            conversionRate={ov.conversionRate}
            autonomyStatus={ov.autonomyStatus}
            highRiskAlertsCount={ov.highRiskAlertsCount}
            revenueNote={ov.revenueNote}
            globalPaused={ov.globalPaused}
            onPauseAll={() => pauseAll(true)}
            onResumeAll={() => pauseAll(false)}
            onQuickMode={(m) => quickMode(m)}
          />
        : null}

        {data?.advisory ?
          <p className="rounded-xl border border-[#D4AF37]/20 bg-[#0d0d0d] px-4 py-3 text-sm text-[#d6d0c4]">{data.advisory}</p>
        : null}

        {data?.selfExpansionHints?.nextBestTerritoryName ?
          <p className="rounded-xl border border-emerald-900/40 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100/95">
            Self-expansion: next focus <span className="font-semibold">{data.selfExpansionHints.nextBestTerritoryName}</span>
            {data.selfExpansionHints.bestEntryHub ?
              <> · lead hub {data.selfExpansionHints.bestEntryHub}</>
            : null}
            {data.selfExpansionHints.topBlocker ?
              <> · blocker: {data.selfExpansionHints.topBlocker}</>
            : null}
            <span className="text-emerald-200/80"> · urgency {data.selfExpansionHints.expansionUrgency}</span>
          </p>
        : null}

        <AiCeoPanel />

        <div className="grid gap-8 xl:grid-cols-2">
          <LiveAutonomyFeed items={data?.liveAutonomyFeed ?? []} />
          <AlertsPanel rows={data?.alertsAndAnomalies ?? []} />
        </div>

        {data ?
          <DomainMatrix rows={data.domainMatrix} onRefresh={load} />
        : null}

        <div className="grid gap-8 xl:grid-cols-2">
          <RevenueGrowthPanel
            bookingsTrend={data?.revenueGrowth.bookingsTrend ?? null}
            conversionTrend={data?.revenueGrowth.conversionTrend ?? null}
            roiNote={data?.revenueGrowth.roiSignalsBand ?? null}
            capitalNote={data?.revenueGrowth.capitalAllocationImpact ?? null}
          />
          <MarketingExpansionPanel
            campaignsRunning={data?.marketingExpansion.campaignsRunning ?? null}
            seoPagesGenerated={data?.marketingExpansion.seoPagesGenerated ?? null}
            calendarNote={data?.marketingExpansion.contentCalendarNote ?? null}
          />
        </div>

        {data ?
          <DealIntelligencePanel
            priority={data.dealIntelligence.priorityDeals}
            stalled={data.dealIntelligence.stalledDeals}
            hot={data.dealIntelligence.highProbabilityDeals}
            riskDistribution={data.dealIntelligence.riskDistribution}
          />
        : null}

        <DisputeObservabilityPanel metrics={data?.disputeObservability} />

        <div className="grid gap-8 xl:grid-cols-2">
          {data ?
            <RiskCompliancePanel
              blockedActions={data.riskCompliance.blockedActions}
              complianceAlerts={data.riskCompliance.complianceAlerts}
              insuranceCoownershipReviewFlags={data.riskCompliance.insuranceCoownershipReviewFlags}
              fraudSignals={data.riskCompliance.fraudSignals}
            />
          : null}
          {data ?
            <ApprovalQueuePanel
              rows={data.approvalQueue}
              onApprove={approveRow}
              onReject={rejectRow}
              onInspect={(id) => router.push(`/dashboard/admin/autonomy-command-center/${id}`)}
            />
          : null}
        </div>

        {data ?
          <AutonomyMetricsPanel rows={data.performanceByDomain} />
        : null}
      </div>
    </div>
  );
}
