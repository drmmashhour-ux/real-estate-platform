"use client";

import { useCallback, useState } from "react";

import type { AuditItem, AuditResult } from "@/lib/launch/readinessAuditTypes";

function iconFor(s: AuditItem["status"]): string {
  if (s === "pass") return "✔";
  if (s === "warn") return "⚠";
  return "✖";
}

function badgeFor(score: number, critical: boolean) {
  if (!critical) {
    return { label: "Not ready", className: "bg-rose-950/80 text-rose-200 ring-rose-500/40" };
  }
  if (score >= 80) {
    return { label: "Ready", className: "bg-emerald-950/60 text-emerald-200 ring-emerald-500/30" };
  }
  if (score >= 50) {
    return { label: "Caution", className: "bg-amber-950/50 text-amber-200 ring-amber-400/40" };
  }
  return { label: "Caution", className: "bg-amber-950/50 text-amber-200 ring-amber-400/40" };
}

type Props = { initial: AuditResult | null; initialError: string | null };

export function LaunchReadinessClient({ initial, initialError }: Props) {
  const [data, setData] = useState<AuditResult | null>(initial);
  const [err, setErr] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/launch/readiness", { method: "GET", credentials: "include" });
      const j = (await res.json()) as AuditResult & { error?: string };
      if (!res.ok) {
        setErr(j.error || `HTTP ${res.status}`);
        return;
      }
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const exportJson = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `launch-readiness-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(u);
  }, [data]);

  const badge = data ? badgeFor(data.score, data.criticalPass) : { label: "—", className: "bg-zinc-800 text-zinc-400" };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-400">Readiness score</h2>
          <p className="mt-1 text-4xl font-bold tabular-nums text-white">
            {data ? `${data.score}` : "—"}
            <span className="text-2xl font-medium text-zinc-500">/100</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">Weighted: pass +10, warn +5, fail +0; scaled to 0–100.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ${badge.className}`}
          >
            {badge.label}
          </span>
          {data ? (
            <span className="text-xs text-zinc-500">
              Critical checks: {data.criticalPass ? "all passed" : "failed"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Running…" : "Run check"}
        </button>
        <button
          type="button"
          onClick={exportJson}
          disabled={!data}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
        >
          Export report
        </button>
      </div>

      {err ? <p className="text-sm text-rose-300">{err}</p> : null}

      {data ? (
        <ul className="space-y-3" role="list">
          {data.items.map((it) => (
            <li
              key={it.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-200"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-white">
                  <span className="mr-2" aria-hidden>
                    {iconFor(it.status)}
                  </span>
                  {it.label}
                </span>
                <span
                  className={
                    it.status === "pass"
                      ? "text-emerald-400/90"
                      : it.status === "warn"
                        ? "text-amber-300/90"
                        : "text-rose-300/90"
                  }
                >
                  {it.status}
                </span>
              </div>
              {it.details ? <p className="mt-1 text-xs text-zinc-500">{it.details}</p> : null}
            </li>
          ))}
        </ul>
      ) : !loading && !err ? (
        <p className="text-sm text-zinc-500">Click <strong>Run check</strong> to load a fresh audit.</p>
      ) : null}
    </div>
  );
}
