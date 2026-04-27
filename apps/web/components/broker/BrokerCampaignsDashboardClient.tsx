"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { trackEvent } from "@/src/services/analytics";
import { cn } from "@/lib/utils";

type CampaignRow = {
  id: string;
  userId: string;
  audience: string;
  city: string | null;
  platform: string;
  headline: string;
  body: string;
  status: string;
  createdBy: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

type Perf = {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
} | null;

type Derived = {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  conversionRate: number;
  costPerConversion: number | null;
} | null;

type Row = { campaign: CampaignRow; performance: Perf; metrics: Derived };

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    scheduled: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
    running: "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200",
    completed: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        map[status] ?? map.draft
      )}
    >
      {status}
    </span>
  );
}

export function BrokerCampaignsDashboardClient({
  initialRows,
  listTotal,
  featureEnabled,
}: {
  initialRows: Row[];
  listTotal: number;
  featureEnabled: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [totalCount, setTotalCount] = useState(listTotal);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [optimizeId, setOptimizeId] = useState<string | null>(null);
  const [optimizeHint, setOptimizeHint] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/marketing/campaign/performance?limit=20&offset=0", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      mode: string;
      total?: number;
      items: Array<{
        campaign: CampaignRow;
        latestPerformance: NonNullable<Perf>;
        metrics: NonNullable<Derived>;
      } | { campaign: CampaignRow; latestPerformance: null; metrics: null }>;
    };
    if (data.mode !== "campaigns") return;
    if (typeof data.total === "number") {
      setTotalCount(data.total);
    }
    setRows(
      data.items.map((i) => ({
        campaign: i.campaign,
        performance: i.latestPerformance
          ? {
              impressions: i.latestPerformance.impressions,
              clicks: i.latestPerformance.clicks,
              conversions: i.latestPerformance.conversions,
              spend: i.latestPerformance.spend,
            }
          : null,
        metrics: "metrics" in i && i.metrics != null ? i.metrics : null,
      }))
    );
    router.refresh();
  }

  async function runOptimize(campaign: CampaignRow) {
    if (!featureEnabled) return;
    setError(null);
    setOptimizeHint(null);
    setOptimizeId(campaign.id);
    try {
      const res = await fetch("/api/marketing/campaign/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, dryRun: true }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        recommendation?: string;
        reason?: string;
        suggestedAction?: string;
      };
      if (!res.ok) {
        setError(j.error ?? "Optimize failed");
        return;
      }
      void trackEvent("campaign_optimized", {
        campaignId: campaign.id,
        recommendation: j.recommendation ?? "",
      });
      setOptimizeHint(
        `${j.recommendation ?? "—"}: ${j.reason ?? ""} ${j.suggestedAction ? `— ${j.suggestedAction}` : ""}`.trim()
      );
    } finally {
      setOptimizeId(null);
    }
  }

  async function runSimulation(campaign: CampaignRow) {
    if (!featureEnabled) return;
    setError(null);
    setRunId(campaign.id);
    try {
      if (campaign.status === "draft") {
        const s = await fetch("/api/marketing/campaign/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId: campaign.id, scheduledAt: new Date().toISOString() }),
        });
        if (!s.ok) {
          const j = (await s.json().catch(() => ({}))) as { error?: string };
          setError(j.error ?? "Schedule failed");
          return;
        }
      }
      const res = await fetch("/api/marketing/campaign/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Run failed");
        return;
      }
      const data = (await res.json()) as {
        performance: NonNullable<Perf>;
        metrics?: NonNullable<Derived>;
        alreadySimulated?: boolean;
      };
      void trackEvent("campaign_simulated", { campaignId: campaign.id });
      void trackEvent("campaign_run", { campaignId: campaign.id, ...data.performance });
      if (data.alreadySimulated) {
        void trackEvent("campaign_run_skipped", { campaignId: campaign.id });
      } else {
        void trackEvent("campaign_completed", {
          campaignId: campaign.id,
          conversions: data.performance.conversions,
          spend: data.performance.spend,
        });
      }
      await refresh();
    } finally {
      setRunId(null);
    }
  }

  if (!featureEnabled) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Autonomous optimization is disabled.</p>
        <p className="text-xs text-muted-foreground">
          Enable <code className="font-mono">FEATURE_AI_AGENT=1</code> to run simulated campaigns and see performance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {optimizeHint ? (
        <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {optimizeHint}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Showing {rows.length} of {totalCount} campaign{totalCount === 1 ? "" : "s"} (newest first).
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2">Platform</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Impr.</th>
              <th className="px-3 py-2">Clicks</th>
              <th className="px-3 py-2">Conv.</th>
              <th className="px-3 py-2">Spend</th>
              <th className="px-3 py-2">CTR</th>
              <th className="px-3 py-2">CVR (clk)</th>
              <th className="px-3 py-2">Cost / conv.</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-muted-foreground">
                  No campaigns yet. Launch one from Broker Intelligence.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const p = r.performance;
                const m = r.metrics;
                const ctrDisplay = m ? `${(m.ctr * 100).toFixed(2)}%` : p ? "—" : "—";
                const cvrDisplay = m ? `${(m.conversionRate * 100).toFixed(2)}%` : p ? "—" : "—";
                const cpcv =
                  m && m.costPerConversion != null ? `$${m.costPerConversion.toFixed(2)}` : p ? "—" : "—";
                return (
                  <tr key={r.campaign.id} className="border-b border-border/60">
                    <td className="px-3 py-2 font-mono text-xs uppercase">{r.campaign.platform}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={r.campaign.status} />
                    </td>
                    <td className="px-3 py-2">{r.campaign.city ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{p ? p.impressions : "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{p ? p.clicks : "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{p ? p.conversions : "—"}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {p != null ? `$${p.spend.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{p ? ctrDisplay : "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{p ? cvrDisplay : "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{p ? cpcv : "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {r.campaign.status !== "completed" && r.campaign.status !== "running" ? (
                          <button
                            type="button"
                            disabled={runId === r.campaign.id}
                            onClick={() => {
                              void runSimulation(r.campaign);
                            }}
                            className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
                          >
                            {runId === r.campaign.id ? "…" : "Run simulation"}
                          </button>
                        ) : null}
                        {p && r.campaign.status === "completed" ? (
                          <button
                            type="button"
                            disabled={optimizeId === r.campaign.id}
                            onClick={() => {
                              void runOptimize(r.campaign);
                            }}
                            className="rounded-md border border-amber-600/50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-50 dark:text-amber-200 dark:hover:bg-amber-950/40"
                          >
                            {optimizeId === r.campaign.id ? "…" : "Optimize campaign"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
