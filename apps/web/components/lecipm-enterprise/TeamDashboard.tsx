"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DealPipelineBoard, type PipelineColumnId, type PipelineCard } from "./DealPipelineBoard";
import { BrokerPerformancePanel, type BrokerPerformanceRow } from "./BrokerPerformancePanel";
import { ComplianceTracker, type ComplianceSummary } from "./ComplianceTracker";

type TeamDashboardPayload = {
  scopedAs: string;
  deals: {
    id: string;
    dealCode: string | null;
    status: string;
    crmStage: string | null;
    priceCents: number;
    brokerId: string | null;
    brokerLabel: string | null;
    documentCount: number;
    updatedAt: string;
  }[];
  pipelineColumns: Record<PipelineColumnId, PipelineCard[]>;
  riskAlerts: { kind: string; dealId?: string; message: string }[];
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
    actor: { id: string; email: string | null; name: string | null };
  }[];
  brokerPerformance: BrokerPerformanceRow[];
  compliance: ComplianceSummary;
  aiOperatorRecent: { id: string; title: string; type: string; status: string; userId: string; createdAt: string }[];
  leadCount: number;
};

export type TeamDashboardProps = {
  workspaceId: string;
};

export function TeamDashboard({ workspaceId }: TeamDashboardProps) {
  const [data, setData] = useState<TeamDashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamAiBusy, setTeamAiBusy] = useState(false);
  const [teamAiNote, setTeamAiNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/team-dashboard`, { credentials: "include" });
      const json = (await res.json()) as TeamDashboardPayload & { error?: string };
      if (!res.ok) {
        setError(json.error ?? `Failed (${res.status})`);
        return;
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runTeamAi() {
    setTeamAiBusy(true);
    setTeamAiNote(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/lecipm/ai-operator/team-ingest`, {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json()) as { error?: string; proposals?: number };
      if (!res.ok) {
        setTeamAiNote(json.error ?? "AI ingest failed");
        return;
      }
      setTeamAiNote(`Generated ${json.proposals ?? 0} proposal(s).`);
      void load();
    } catch {
      setTeamAiNote("Network error");
    } finally {
      setTeamAiBusy(false);
    }
  }

  if (loading) {
    return <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-8 text-sm text-slate-400">Loading team…</div>;
  }
  if (error || !data) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 text-sm text-amber-100">{error ?? "—"}</div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500/90">Team command center</p>
          <h1 className="text-2xl font-semibold text-slate-100">Deals & compliance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Scoped as <span className="text-slate-300">{data.scopedAs}</span> · {data.leadCount} leads ·{" "}
            {data.deals.length} active deals
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runTeamAi()}
            disabled={teamAiBusy}
            className="rounded-md border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-100 hover:bg-violet-500/20 disabled:opacity-50"
          >
            {teamAiBusy ? "AI…" : "Run team AI insights"}
          </button>
          <Link
            href={`/dashboard/workspaces/${workspaceId}/monopoly`}
            className="rounded-md border border-[#C9A646]/30 px-3 py-2 text-sm text-[#C9A646]/90 hover:bg-[#C9A646]/10"
          >
            Monopoly layer
          </Link>
          <Link
            href={`/dashboard/workspaces/${workspaceId}`}
            className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            Workspace overview
          </Link>
        </div>
      </div>
      {teamAiNote ? <p className="text-sm text-violet-300/90">{teamAiNote}</p> : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-slate-100">Risk alerts</h2>
        {data.riskAlerts.length === 0 ? (
          <p className="text-sm text-slate-500">No automated risk flags in current scope.</p>
        ) : (
          <ul className="space-y-2">
            {data.riskAlerts.slice(0, 12).map((a, i) => (
              <li
                key={`${a.dealId ?? "x"}-${i}`}
                className="rounded-lg border border-amber-500/20 bg-amber-950/10 px-4 py-2 text-sm text-amber-100/90"
              >
                <span className="text-xs uppercase text-amber-500/80">{a.kind}</span> — {a.message}
                {a.dealId ? <span className="ml-2 font-mono text-xs text-slate-500">{a.dealId.slice(0, 8)}…</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-slate-100">Active deals</h2>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2">Ref</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Broker</th>
                <th className="px-4 py-2">Docs</th>
                <th className="px-4 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.deals.map((d) => (
                <tr key={d.id} className="border-b border-white/5">
                  <td className="px-4 py-2 font-mono text-slate-100">{d.dealCode || d.id.slice(0, 8)}</td>
                  <td className="px-4 py-2 text-slate-300">{d.status}</td>
                  <td className="px-4 py-2 text-slate-400">{d.brokerLabel ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-400">{d.documentCount}</td>
                  <td className="px-4 py-2 text-slate-500">{new Date(d.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-slate-100">Deal pipeline</h2>
        <DealPipelineBoard columns={data.pipelineColumns} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-slate-100">Broker performance</h2>
        <BrokerPerformancePanel rows={data.brokerPerformance} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-slate-100">Compliance</h2>
        <ComplianceTracker summary={data.compliance} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-slate-100">Recent activity</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          {data.recentActivity.slice(0, 15).map((ev) => (
            <li key={ev.id} className="flex flex-wrap gap-2 border-b border-white/5 py-2">
              <span className="text-slate-500">{new Date(ev.createdAt).toLocaleString()}</span>
              <span className="text-emerald-400/80">{ev.action}</span>
              <span className="text-slate-500">{ev.entityType}</span>
              <span className="text-slate-400">{ev.actor.name || ev.actor.email || ev.actor.id}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-slate-100">AI operator (workspace)</h2>
        {data.aiOperatorRecent.length === 0 ? (
          <p className="text-sm text-slate-500">No workspace-scoped actions yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-300">
            {data.aiOperatorRecent.map((a) => (
              <li key={a.id} className="rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                <span className="font-medium text-slate-100">{a.title}</span>{" "}
                <span className="text-xs text-slate-500">{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
