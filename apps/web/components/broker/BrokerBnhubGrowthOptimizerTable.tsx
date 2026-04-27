"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { trackEvent } from "@/src/services/analytics";
import { OPTIMIZER_ACTION_LABELS } from "@/lib/campaign-optimizer/optimizerLabels";
import { cn } from "@/lib/utils";

type OptimizerAction = "scale_budget" | "pause_campaign" | "improve_copy" | "keep_running";

type OptimizerApiResult = {
  campaignId: string;
  dryRun: boolean;
  recommendation: OptimizerAction;
  suggestedAction: OptimizerAction;
  reason: string;
  applied: boolean;
  newCopy?: { headline: string; body: string };
};

type Row = {
  campaign: {
    id: string;
    status: string;
    campaignName: string;
    targetCity: string | null;
    targetRegion: string | null;
    campaignType: string;
    createdAt: string;
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number;
    conversionRate: number;
  } | null;
  optimizerPreview: OptimizerApiResult | null;
};

function labelFor(key: string) {
  return OPTIMIZER_ACTION_LABELS[key] ?? key;
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("active") || s === "ready") {
    return "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200";
  }
  if (s.includes("completed")) return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  if (s.includes("draft")) return "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
  if (s.includes("scheduled") || s.includes("awaiting")) {
    return "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200";
  }
  if (s.includes("paused") || s.includes("failed") || s.includes("archived")) {
    return "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200";
  }
  return "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
}

export function BrokerBnhubGrowthOptimizerTable({
  initialRows,
  featureEnabled,
}: {
  initialRows: Row[];
  featureEnabled: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [openId, setOpenId] = useState<string | null>(null);
  const seeded = useMemo(() => {
    const o: Record<string, OptimizerApiResult> = {};
    for (const r of initialRows) {
      if (r.optimizerPreview) {
        o[r.campaign.id] = r.optimizerPreview;
      }
    }
    return o;
  }, [initialRows]);
  const [lastResult, setLastResult] = useState<Record<string, OptimizerApiResult>>(() => ({ ...seeded }));
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyLoadingId, setApplyLoadingId] = useState<string | null>(null);

  if (!featureEnabled) {
    return (
      <section className="rounded-lg border border-dashed p-4">
        <h2 className="text-lg font-semibold">BNHub growth campaigns & optimizer</h2>
        <p className="mt-1 text-sm text-muted-foreground">Autonomous optimization is disabled.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Enable <code className="font-mono">FEATURE_AI_AGENT=1</code> to use the hardened campaign optimizer and apply safe actions.
        </p>
      </section>
    );
  }

  async function postOptimize(campaignId: string, dryRun: boolean) {
    setError(null);
    if (dryRun) {
      setLoadingId(campaignId);
    } else {
      setApplyLoadingId(campaignId);
    }
    try {
      const res = await fetch("/api/bnhub/growth/optimize-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, dryRun }),
      });
      const data = (await res.json()) as OptimizerApiResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? data.reason ?? "Optimizer failed");
        return;
      }
      setLastResult((r) => ({ ...r, [campaignId]: data }));
      if (!dryRun && data.applied) {
        void trackEvent("campaign_optimization_applied", { campaignId, suggestedAction: data.suggestedAction });
        // Refresh row status: completed for pause
        setRows((prev) =>
          prev.map((row) => {
            if (row.campaign.id !== campaignId) return row;
            if (data.suggestedAction === "pause_campaign" && data.applied) {
              return { ...row, campaign: { ...row.campaign, status: "COMPLETED" } };
            }
            return row;
          })
        );
        router.refresh();
      } else {
        void trackEvent("campaign_optimization_generated", { campaignId, dryRun, recommendation: data.recommendation });
      }
    } finally {
      setLoadingId(null);
      setApplyLoadingId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">BNHub growth campaigns</h2>
        <p className="text-sm text-muted-foreground">
          Hardened optimizer (Order 39.1) — dry run by default. Only <strong>pause</strong> can be applied on your confirmation.
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-2 py-2">Campaign</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">City</th>
              <th className="px-2 py-2">Impr.</th>
              <th className="px-2 py-2">Clicks</th>
              <th className="px-2 py-2">Conv.</th>
              <th className="px-2 py-2">Spend</th>
              <th className="px-2 py-2">CTR</th>
              <th className="px-2 py-2">Optimization</th>
              <th className="px-2 py-2">Suggested</th>
              <th className="px-2 py-2">Reason</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-muted-foreground">
                  No BNHub growth campaigns yet. Create one from the host growth / marketing flows.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const p = r.performance;
                const live = lastResult[r.campaign.id] ?? r.optimizerPreview;
                const rec = live?.recommendation;
                const reason = live?.reason ?? "—";
                const showApplyPause =
                  !!live && live.suggestedAction === "pause_campaign" && live.dryRun === true && !live.applied;
                return (
                  <Fragment key={r.campaign.id}>
                    <tr className="border-b border-border/60">
                      <td className="max-w-[200px] px-2 py-2 font-medium leading-snug">
                        {r.campaign.campaignName}
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">{r.campaign.campaignType}</div>
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                            statusBadgeClass(r.campaign.status)
                          )}
                        >
                          {r.campaign.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-2 py-2">{r.campaign.targetCity ?? r.campaign.targetRegion ?? "—"}</td>
                      <td className="px-2 py-2 tabular-nums">{p != null ? p.impressions : "—"}</td>
                      <td className="px-2 py-2 tabular-nums">{p != null ? p.clicks : "—"}</td>
                      <td className="px-2 py-2 tabular-nums">{p != null ? p.conversions : "—"}</td>
                      <td className="px-2 py-2 tabular-nums">{p != null ? `$${p.spend.toFixed(2)}` : "—"}</td>
                      <td className="px-2 py-2 tabular-nums">
                        {p != null ? `${(p.ctr * 100).toFixed(2)}%` : "—"}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {rec ? labelFor(rec) : "—"}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {live ? labelFor(live.suggestedAction) : "—"}
                      </td>
                      <td className="max-w-[220px] px-2 py-2 text-xs text-muted-foreground" title={reason}>
                        {reason.length > 80 ? `${reason.slice(0, 80)}…` : reason}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
                            disabled={loadingId === r.campaign.id}
                            onClick={() => {
                              setOpenId(r.campaign.id);
                              void postOptimize(r.campaign.id, true);
                            }}
                          >
                            {loadingId === r.campaign.id ? "…" : "Optimize campaign"}
                          </button>
                          {showApplyPause ? (
                            <button
                              type="button"
                              className="rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
                              disabled={applyLoadingId === r.campaign.id}
                              onClick={() => {
                                void postOptimize(r.campaign.id, false);
                              }}
                            >
                              {applyLoadingId === r.campaign.id ? "…" : "Apply pause"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {openId === r.campaign.id && (lastResult[r.campaign.id] || loadingId === r.campaign.id) ? (
                      <tr className="border-b bg-muted/20">
                        <td colSpan={12} className="px-3 py-3">
                          {(() => {
                            const d = lastResult[r.campaign.id];
                            if (!d) {
                              return <p className="text-xs text-muted-foreground">Loading…</p>;
                            }
                            return (
                              <div className="space-y-2 text-sm">
                                <p>
                                  <span className="font-medium">Recommendation:</span> {labelFor(d.recommendation)}
                                </p>
                                <p>
                                  <span className="font-medium">Suggested action:</span> {labelFor(d.suggestedAction)}
                                </p>
                                <p>
                                  <span className="font-medium">Reason:</span>{" "}
                                  <span className="text-muted-foreground">{d.reason}</span>
                                </p>
                                {d.suggestedAction === "improve_copy" && d.newCopy ? (
                                  <div className="rounded-md border p-2">
                                    <p className="text-xs font-medium">Suggested copy (copy-only — not auto-saved)</p>
                                    <p className="mt-1 text-xs font-semibold">{d.newCopy.headline}</p>
                                    <p className="text-xs text-muted-foreground">{d.newCopy.body}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        className="rounded border px-2 py-1 text-xs"
                                        onClick={() => void navigator.clipboard.writeText(d.newCopy!.headline)}
                                      >
                                        Copy headline
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded border px-2 py-1 text-xs"
                                        onClick={() => void navigator.clipboard.writeText(d.newCopy!.body)}
                                      >
                                        Copy body
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                                {d.suggestedAction === "scale_budget" ? (
                                  <p className="text-xs text-amber-800 dark:text-amber-200">
                                    Scale budget is recommendation-only; no auto-apply. Adjust budgets in your ad tooling when ready.
                                  </p>
                                ) : null}
                                {d.dryRun && d.suggestedAction === "pause_campaign" ? (
                                  <p className="text-xs text-muted-foreground">Dry run — no status change. Use “Apply pause” to end this campaign.</p>
                                ) : null}
                                {!d.dryRun && d.applied ? (
                                  <p className="text-xs text-emerald-700 dark:text-emerald-300">Update applied (pause recorded).</p>
                                ) : null}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
