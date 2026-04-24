"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type OverviewResponse = {
  ok: boolean;
  policies?: Array<{
    id: string;
    domain: string;
    strategyKey: string;
    status: string;
    source: string;
    createdAt: string;
    approvedAt: string | null;
    executions: Array<{
      id: string;
      rolloutPercent: number;
      cohortKey: string;
      status: string;
      startedAt: string;
      lastEvaluatedAt: string | null;
      metricSnapshots: Array<{ timestamp: string; metricsJson: unknown }>;
      decisionLogs: Array<{ action: string; reason: string; createdAt: string }>;
    }>;
  }>;
  error?: string;
};

export default function RolloutCommandCenterPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/rollout/overview", { credentials: "include" });
    const j = (await r.json()) as OverviewResponse;
    setData(j);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (policyId: string) => {
    setBusyId(policyId);
    try {
      const r = await fetch(`/api/rollout/policy/${policyId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      const j = await r.json();
      if (!j.ok) {
        alert(j.error ?? "Approve failed");
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <h1 className="text-xl font-semibold text-zinc-50">Autonomous rollout</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Policy → approval → gradual cohort → metrics → auto ramp / rollback
        </p>
      </div>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/admin/command-center" className="text-sm text-amber-400/90 hover:underline">
            ← Command center
          </Link>
          <Button variant="secondary" type="button" onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        {!data?.ok && (
          <Card className="border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
            {data?.error ?? "Unable to load overview (admin sign-in required)."}
          </Card>
        )}

        {data?.ok &&
          data.policies?.map((p) => (
            <Card key={p.id} className="border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-50">{p.strategyKey}</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {p.domain} · {p.source} · <span className="text-amber-200/90">{p.status}</span>
                  </p>
                  <p className="mt-1 font-mono text-xs text-zinc-500">{p.id}</p>
                </div>
                {p.status === "DRAFT" && (
                  <Button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => void approve(p.id)}
                  >
                    {busyId === p.id ? "Approving…" : "Approve & start 5% rollout"}
                  </Button>
                )}
              </div>

              {p.executions.map((ex) => (
                <div key={ex.id} className="mt-4 rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span>
                      Rollout: <strong className="text-amber-200">{ex.rolloutPercent}%</strong>
                    </span>
                    <span>Execution: {ex.status}</span>
                    <span className="text-zinc-500">Cohort salt: {ex.cohortKey.slice(0, 12)}…</span>
                  </div>
                  {ex.decisionLogs.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Decisions [rollout]
                      </p>
                      <ul className="mt-1 max-h-40 overflow-auto text-xs text-zinc-300">
                        {ex.decisionLogs.map((l) => (
                          <li key={l.createdAt + l.action}>
                            <span className="text-amber-200/80">{l.action}</span> — {l.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ex.metricSnapshots.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Recent metrics
                      </p>
                      <pre className="mt-1 max-h-32 overflow-auto rounded bg-black/40 p-2 text-[11px] text-zinc-400">
                        {JSON.stringify(ex.metricSnapshots[0]?.metricsJson, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </Card>
          ))}

        {data?.ok && (data.policies?.length ?? 0) === 0 && (
          <Card className="border border-zinc-800 p-6 text-sm text-zinc-400">
            No rollout policies yet. Approving an evolution experiment or executing a gated CEO / autonomy
            pricing-ranking proposal creates DRAFT policies here.
          </Card>
        )}
      </div>
    </div>
  );
}
