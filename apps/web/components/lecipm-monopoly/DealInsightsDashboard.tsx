"use client";

import { useCallback, useEffect, useState } from "react";

type InsightsPayload = {
  insights: {
    successPatterns: string[];
    riskFactors: string[];
    optimalStrategies: string[];
    dataScope: string;
  };
  aggregates: {
    historyRows: number;
    won: number;
    lost: number;
    canceled: number;
    avgDaysToOutcome: number | null;
    activeBrokersInHistory: number;
  };
  networkEffects: { referralsRecorded: number; dealSharesCount: number };
};

export function DealInsightsDashboard({ workspaceId }: { workspaceId: string }) {
  const [data, setData] = useState<InsightsPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/monopoly/insights`, { credentials: "include" });
      const json = (await res.json()) as InsightsPayload & { error?: string };
      if (!res.ok) {
        setErr(json.error ?? "Failed");
        return;
      }
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-slate-500">Loading insights…</p>;
  if (err) return <p className="text-sm text-amber-200">{err}</p>;
  if (!data) return null;

  const { insights, aggregates, networkEffects } = data;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-medium text-slate-100">Deal intelligence</h2>
        <p className="mt-1 text-xs text-slate-500">
          {insights.dataScope.replace(/_/g, " ")} · referrals {networkEffects.referralsRecorded} · internal shares{" "}
          {networkEffects.dealSharesCount}
        </p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
            <dt className="text-xs text-slate-500">Outcomes logged</dt>
            <dd className="font-semibold text-slate-100">{aggregates.historyRows}</dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
            <dt className="text-xs text-slate-500">W / L / C</dt>
            <dd className="font-semibold text-slate-100">
              {aggregates.won} / {aggregates.lost} / {aggregates.canceled}
            </dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
            <dt className="text-xs text-slate-500">Avg days to outcome</dt>
            <dd className="font-semibold text-slate-100">
              {aggregates.avgDaysToOutcome != null ? aggregates.avgDaysToOutcome.toFixed(0) : "—"}
            </dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <InsightColumn title="Success patterns" items={insights.successPatterns} tone="emerald" />
        <InsightColumn title="Risk factors" items={insights.riskFactors} tone="amber" />
        <InsightColumn title="Optimal strategies" items={insights.optimalStrategies} tone="violet" />
      </div>
    </div>
  );
}

function InsightColumn({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "amber" | "violet";
}) {
  const border =
    tone === "emerald"
      ? "border-emerald-500/20"
      : tone === "amber"
        ? "border-amber-500/20"
        : "border-violet-500/20";
  return (
    <div className={`rounded-xl border ${border} bg-[#0a0a0a] p-4`}>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-slate-400">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
