"use client";

import { useCallback, useEffect, useState } from "react";
import {
  emptyTotals,
  LAUNCH_METRIC_KEYS,
  type LaunchDailyRow,
  type LaunchMetricKey,
} from "@/lib/launch-tracking/metrics";
import type { LaunchDailyReport } from "@/lib/launch-tracking/generateLaunchDailyReport";
import { ContentStatsPanel } from "./ContentStatsPanel";
import { ConversionStatsPanel } from "./ConversionStatsPanel";
import { OutreachStatsPanel } from "./OutreachStatsPanel";

type Payload = {
  series: LaunchDailyRow[];
  totals: Record<LaunchMetricKey, number>;
  report: LaunchDailyReport;
  rangeDays: number;
};

const METRIC_LABELS: Record<LaunchMetricKey, string> = {
  messagesSent: "Messages sent",
  repliesReceived: "Replies received",
  demosBooked: "Demos booked",
  demosCompleted: "Demos completed",
  usersCreated: "Users created",
  activatedUsers: "Activated users",
  payingUsers: "Paying users",
  postsCreated: "Posts created",
  contentViews: "Content views",
  contentClicks: "Content clicks",
  contentConversions: "Content conversions",
};

export function LaunchDashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metric, setMetric] = useState<LaunchMetricKey>("messagesSent");
  const [delta, setDelta] = useState("1");

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/launch-tracking?days=30", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Failed to load");
      setData(null);
      return;
    }
    setData(json as Payload);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const onAdd = async () => {
    const n = Number(delta);
    if (!Number.isFinite(n) || n === 0) {
      setError("Delta must be a non-zero number");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/launch-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metric, delta: Math.trunc(n) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Save failed");
        return;
      }
      await load();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-400">Loading launch metrics…</p>;
  }

  const totals = data?.totals ?? emptyTotals();
  const series = data?.series ?? [];
  const report = data?.report ?? { worked: [], didnt: [], improve: [] };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-[#C9A646]/30 bg-[#C9A646]/5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#C9A646]">Log activity (today, UTC)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Increments the selected counter for the current UTC day. Use negative delta to correct mistakes.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Metric
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as LaunchMetricKey)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-slate-100"
            >
              {LAUNCH_METRIC_KEYS.map((k) => (
                <option key={k} value={k}>
                  {METRIC_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Delta
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              className="w-24 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onAdd()}
            className="rounded-lg bg-[#C9A646] px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add to today"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <OutreachStatsPanel totals={totals} series={series} />
        <ContentStatsPanel totals={totals} series={series} />
        <ConversionStatsPanel totals={totals} series={series} />
      </section>

      <section className="rounded-xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-lg font-medium text-slate-100">Daily report</h2>
        <p className="mt-1 text-xs text-slate-500">Heuristic summary from the loaded window ({data?.rangeDays ?? 30} days)</p>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          <ReportColumn title="What worked" items={report.worked} variant="emerald" />
          <ReportColumn title="What did not work" items={report.didnt} variant="rose" />
          <ReportColumn title="What to improve" items={report.improve} variant="amber" />
        </div>
      </section>
    </div>
  );
}

function ReportColumn({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "emerald" | "rose" | "amber";
}) {
  const border =
    variant === "emerald"
      ? "border-emerald-500/30"
      : variant === "rose"
        ? "border-rose-500/30"
        : "border-amber-500/30";
  const text =
    variant === "emerald" ? "text-emerald-200/90" : variant === "rose" ? "text-rose-200/90" : "text-amber-200/90";

  return (
    <div className={`rounded-lg border ${border} bg-black/20 p-4`}>
      <h3 className={`text-sm font-semibold ${text}`}>{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">Nothing flagged yet.</p>
      ) : (
        <ul className="mt-2 list-disc space-y-2 pl-4 text-sm text-slate-300">
          {items.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
