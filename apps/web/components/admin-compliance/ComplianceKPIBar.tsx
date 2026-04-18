"use client";

import type { ComplianceAnalyticsPayload, ComplianceAnalyticsWindow } from "@/modules/compliance-analytics/compliance-analytics.types";

const WINDOWS: { value: ComplianceAnalyticsWindow; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "quarter", label: "Quarter" },
];

export function ComplianceKPIBar(props: {
  analytics: ComplianceAnalyticsPayload;
  analyticsWindow: ComplianceAnalyticsWindow;
  onWindowChange?: (w: ComplianceAnalyticsWindow) => void;
  busy?: boolean;
}) {
  const { analytics, analyticsWindow, onWindowChange, busy } = props;
  const kpis = [
    { label: "Open cases", value: analytics.openCases },
    { label: "Critical", value: analytics.criticalCases, warn: analytics.criticalCases > 0 },
    { label: "Avg review days", value: analytics.avgReviewTurnaroundDays ?? "—" },
    { label: "Changes required rate", value: formatRate(analytics.changesRequiredRate) },
    { label: "Blocked closings", value: analytics.blockedClosings, warn: analytics.blockedClosings > 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-500/90">Compliance KPIs</p>
        {onWindowChange && (
          <div className="flex flex-wrap gap-1">
            {WINDOWS.map((w) => (
              <button
                key={w.value}
                type="button"
                disabled={busy}
                onClick={() => onWindowChange(w.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
                  analyticsWindow === w.value
                    ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/40"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-xl border px-4 py-3 ${
              k.warn ? "border-red-500/35 bg-red-950/20" : "border-amber-500/15 bg-zinc-950/80"
            }`}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{k.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-100">{k.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-zinc-500">{analytics.disclaimer}</p>
    </div>
  );
}

function formatRate(v: number | null) {
  if (v === null || Number.isNaN(v)) return "—";
  return `${Math.round(v * 1000) / 10}%`;
}
