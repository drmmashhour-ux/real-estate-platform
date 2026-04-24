"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { ScenarioApprovalPanel } from "@/components/scenario-autopilot/ScenarioApprovalPanel";
import { ScenarioComparisonTable } from "@/components/scenario-autopilot/ScenarioComparisonTable";
import { ScenarioImpactChart } from "@/components/scenario-autopilot/ScenarioImpactChart";
import { ScenarioOutcomeCard } from "@/components/scenario-autopilot/ScenarioOutcomeCard";
import { ScenarioRollbackPanel } from "@/components/scenario-autopilot/ScenarioRollbackPanel";
import type { EnrichedCandidate } from "@/modules/scenario-autopilot/scenario-autopilot.types";
import type { OutcomeRecord } from "@/modules/scenario-autopilot/scenario-autopilot.types";
import type { RankingResult } from "@/modules/scenario-autopilot/scenario-autopilot.types";

type RunRow = {
  id: string;
  status: string;
  bestCandidateId: string | null;
  createdAt: string;
  rankingRationale: string | null;
};

export default function ScenarioAutopilotAdminPage() {
  const [runId, setRunId] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingResult | null>(null);
  const [best, setBest] = useState<EnrichedCandidate | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<OutcomeRecord | null>(null);
  const [execStatus, setExecStatus] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    const res = await fetch("/api/admin/scenario-autopilot/runs", { credentials: "same-origin" });
    const data = (await res.json()) as { runs?: RunRow[] };
    if (data.runs) setRuns(data.runs);
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const generate = async () => {
    setBusy(true);
    setOutcome(null);
    try {
      const res = await fetch("/api/admin/scenario-autopilot/generate", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        id?: string;
        ranking?: RankingResult;
        whyApproval?: string;
        successPreview?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "generate_failed");
      setRunId(data.id ?? null);
      setRanking(data.ranking ?? null);
      setBest(data.ranking?.best ?? null);
      setWhy(data.whyApproval ?? null);
      setSuccess(data.successPreview ?? null);
      setExecStatus(null);
      await loadRuns();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!runId) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/scenario-autopilot/runs/${runId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({}),
      });
      setExecStatus("approved");
      await loadRuns();
    } finally {
      setBusy(false);
    }
  };

  const reject = async (reason: string, revision: boolean) => {
    if (!runId) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/scenario-autopilot/runs/${runId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reason, requestRevision: revision }),
      });
      setRunId(null);
      await loadRuns();
    } finally {
      setBusy(false);
    }
  };

  const execute = async () => {
    if (!runId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/scenario-autopilot/runs/${runId}/execute`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "execute_failed");
      setExecStatus("executed");
      await loadRuns();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const measure = async () => {
    if (!runId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/scenario-autopilot/runs/${runId}/outcome`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { outcome?: OutcomeRecord; error?: string };
      if (res.ok && data.outcome) setOutcome(data.outcome);
    } finally {
      setBusy(false);
    }
  };

  const rollback = async (reason: string) => {
    if (!runId) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/scenario-autopilot/runs/${runId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reason }),
      });
      await loadRuns();
    } finally {
      setBusy(false);
    }
  };

  const candidates = ranking?.all ?? [];
  const current = runs.find((r) => r.id === runId);
  const reversible = best?.reversible ?? false;

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 text-[#f4efe4]">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1c1c1c] pb-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90">Admin</p>
            <h1 className="mt-1 font-serif text-3xl">Scenario Autopilot</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500">
              Generate candidates, simulate (no live data writes), rank, approve, then execute. All steps are auditable.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/lecipm" className="text-sm text-[#D4AF37] underline">
              LECIPM Command Center
            </Link>
            <Link href="/dashboard/admin/autonomy-command-center" className="text-sm text-neutral-500 underline">
              Autonomy center
            </Link>
          </div>
        </header>

        <section className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void generate()}
            className="rounded-full bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {busy ? "Working…" : "Generate scenario batch"}
          </button>
          {runId && execStatus === "approved" ?
            <button
              type="button"
              disabled={busy}
              onClick={() => void execute()}
              className="rounded-full border border-[#D4AF37]/50 px-5 py-2 text-sm text-[#D4AF37] disabled:opacity-50"
            >
              Execute approved run
            </button>
          : null}
          {runId && execStatus === "executed" ?
            <button
              type="button"
              disabled={busy}
              onClick={() => void measure()}
              className="rounded-full border border-neutral-600 px-5 py-2 text-sm text-neutral-300 disabled:opacity-50"
            >
              Measure outcome
            </button>
          : null}
        </section>

        {why ?
          <p className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-neutral-400">{why}</p>
        : null}
        {success ?
          <p className="text-sm text-neutral-500">{success}</p>
        : null}

        {ranking && best ?
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Simulation comparison</h2>
            <ScenarioComparisonTable candidates={candidates} bestId={best.id} />
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase text-neutral-500">Why the best won</h3>
                <p className="mt-2 text-sm text-neutral-300">{ranking.reasonBestWon}</p>
                <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-neutral-500">
                  {ranking.reasonAlternativesLower.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-neutral-500">Predicted impact (best)</h3>
                <div className="mt-2">
                  <ScenarioImpactChart metrics={best.normalized} />
                </div>
              </div>
            </div>
          </section>
        : null}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Approval queue</h2>
          <ScenarioApprovalPanel runId={runId} onApprove={() => void approve()} onReject={(r, v) => void reject(r, v)} busy={busy} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Executed / rollback</h2>
          <ScenarioRollbackPanel
            runId={current?.status === "EXECUTED" ? runId : null}
            reversible={reversible}
            onRollback={(r) => void rollback(r)}
            busy={busy}
          />
        </section>

        {outcome ?
          <section>
            <h2 className="text-sm font-semibold uppercase text-neutral-500">Outcome tracker</h2>
            <div className="mt-2">
              <ScenarioOutcomeCard outcome={outcome} />
            </div>
          </section>
        : null}

        <section>
          <h2 className="text-sm font-semibold uppercase text-neutral-500">Recent runs</h2>
          <ul className="mt-2 space-y-2 text-sm text-neutral-400">
            {runs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1a1a1a] py-2">
                <span className="font-mono text-xs text-neutral-500">{r.id.slice(0, 10)}…</span>
                <span className="text-[#D4AF37]">{r.status}</span>
                <button
                  type="button"
                  className="text-xs text-[#D4AF37] underline"
                  onClick={() => {
                    setRunId(r.id);
                    setExecStatus(
                      r.status === "APPROVED" ? "approved"
                      : r.status === "EXECUTED" ? "executed"
                      : null,
                    );
                    void loadRunDetail(r.id);
                  }}
                >
                  Use
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
