"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import type {
  GovernanceIntelligenceCluster,
  GovernanceIntelligenceDriftAlert,
} from "@/modules/autonomous-marketplace/feedback/governance-feedback-intelligence.types";

type ApiOk = {
  ok: true;
  clusters: GovernanceIntelligenceCluster[];
  driftAlerts: GovernanceIntelligenceDriftAlert[];
  usedDemoRecords: boolean;
  recordCount: number;
};

function severityClusterClass(s: GovernanceIntelligenceCluster["severity"]) {
  if (s === "CRITICAL") return "border-rose-500/40 bg-rose-950/35";
  if (s === "WARNING") return "border-amber-500/35 bg-amber-950/25";
  return "border-slate-700 bg-slate-950/40";
}

function severityDriftClass(s: GovernanceIntelligenceDriftAlert["severity"]) {
  if (s === "CRITICAL") return "border-rose-500/40 bg-rose-950/30";
  return "border-amber-500/35 bg-amber-950/20";
}

function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

export type GovernanceIntelligencePanelProps = {
  /** When true, append `demo=1` so empty feedback store still returns advisory demo intelligence. */
  demoWhenEmpty?: boolean;
  limit?: number;
};

export function GovernanceIntelligencePanel({ demoWhenEmpty = true, limit = 500 }: GovernanceIntelligencePanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiOk | null>(null);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("limit", String(limit));
    if (demoWhenEmpty) q.set("demo", "1");
    return q.toString();
  }, [demoWhenEmpty, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/autonomy/governance-intelligence?${query}`, {
        credentials: "same-origin",
      });
      const json = (await res.json()) as ApiOk | { ok?: boolean; error?: string };
      if (!res.ok || json.ok !== true || !("clusters" in json)) {
        const msg =
          typeof json === "object" && json && "error" in json && typeof json.error === "string"
            ? json.error
            : "Could not load governance intelligence.";
        setError(msg);
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Could not load governance intelligence.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3 text-sm text-slate-300" aria-busy="true">
        <div className="h-5 w-56 animate-pulse rounded bg-slate-800" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-28 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60" />
          <div className="h-28 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60" />
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-rose-300">{error}</p>;
  }

  const clusters = data?.clusters ?? [];
  const driftAlerts = data?.driftAlerts ?? [];
  const emptySignals = clusters.length === 0 && driftAlerts.length === 0;

  return (
    <div className="space-y-4 text-sm text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Clustering + drift are advisory — derived from labeled outcomes ({data?.recordCount ?? 0} rows).
        </p>
        {data?.usedDemoRecords ? (
          <span className="rounded-full border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-[11px] font-medium text-amber-100">
            Demo dataset (no live feedback yet)
          </span>
        ) : null}
      </div>

      {emptySignals ? (
        <Card className="!border-slate-800 !bg-slate-950/50 !p-4">
          <p className="text-sm text-slate-400">
            No clusters or drift alerts for this window. With <code className="text-slate-300">demo=1</code> and an empty
            store, synthetic rows illustrate the signals.
          </p>
        </Card>
      ) : null}

      {clusters.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk clusters & hotspots</h3>
          <ul className="mt-2 grid gap-3 md:grid-cols-2">
            {clusters.map((c) => (
              <li key={c.id}>
                <Card className={`!p-4 ${severityClusterClass(c.severity)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.severity}</span>
                    <span className="text-[11px] text-slate-500">{c.dimension}</span>
                  </div>
                  <p className="mt-2 font-medium text-slate-100">{c.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{c.rationale}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>
                      <dt className="text-slate-600">Cases</dt>
                      <dd className="font-mono text-slate-200">{c.caseCount}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-600">Leakage (est.)</dt>
                      <dd className="font-mono text-slate-200">{c.leakedRevenueSum.toFixed(0)}</dd>
                    </div>
                  </dl>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {driftAlerts.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Drift alerts</h3>
          <ul className="mt-2 space-y-3">
            {driftAlerts.map((d) => (
              <li key={d.id}>
                <Card className={`!p-4 ${severityDriftClass(d.severity)}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{d.severity}</span>
                    <span className="font-mono text-[11px] text-slate-500">{d.metric}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{d.rationale}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <dt className="text-slate-600">Baseline</dt>
                      <dd className="font-mono text-slate-200">{pct(d.baselineRate)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-600">Recent</dt>
                      <dd className="font-mono text-slate-200">{pct(d.recentRate)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-600">Δ</dt>
                      <dd className="font-mono text-slate-200">{pct(d.delta)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-600">n</dt>
                      <dd className="font-mono text-slate-200">
                        {d.baselineSampleSize}+{d.recentSampleSize}
                      </dd>
                    </div>
                  </dl>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
