"use client";

import { useCallback, useEffect, useState } from "react";
import { AutonomySummaryCards } from "@/components/autonomy/AutonomySummaryCards";
import { AutonomyQueueTable } from "@/components/autonomy/AutonomyQueueTable";
import { AutonomyPolicyCard } from "@/components/autonomy/AutonomyPolicyCard";
import { AutonomyActionDetail } from "@/components/autonomy/AutonomyActionDetail";
import { ApprovalActionsPanel } from "@/components/autonomy/ApprovalActionsPanel";
import { LecipmAutonomyPanel } from "@/components/autonomy/LecipmAutonomyPanel";

type QueueItem = {
  id: string;
  status: string;
  domain: string;
  actionType: string;
  riskLevel: string;
  autonomyMode: string;
  createdAt: string;
  rationale: string | null;
  candidateJson: unknown;
};

export function AutonomyDashboard({ isAdmin }: { isAdmin: boolean }) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [policies, setPolicies] = useState<
    Array<{
      id: string;
      scopeType: string;
      scopeKey: string;
      autonomyMode: string;
      maxRiskLevel: string;
      emergencyFreeze: boolean;
      version: number;
    }>
  >([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [runLog, setRunLog] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/autonomy/queue", { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; items?: QueueItem[]; error?: string };
      if (j.items) setItems(j.items);
      if (!j.ok) setErr(j.error ?? "queue_load_failed");
    } catch {
      setErr("queue_load_failed");
    }
    if (isAdmin) {
      try {
        const pr = await fetch("/api/autonomy/policies", { credentials: "same-origin" });
        const pj = (await pr.json()) as { policies?: typeof policies; ok?: boolean };
        if (pj.policies) setPolicies(pj.policies as typeof policies);
      } catch {
        /* optional */
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedRow = items.find((x) => x.id === selected) ?? null;

  const counts = {
    queued: items.filter((i) => i.status === "QUEUED").length,
    executed: items.filter((i) => i.status === "EXECUTED").length,
    blocked: items.filter((i) => i.status === "BLOCKED").length,
    pendingApproval: items.filter((i) => i.status === "QUEUED").length,
  };

  const freeze = policies.some((p) => p.emergencyFreeze);
  const mode = policies[0]?.autonomyMode;

  async function postApprove(executeAfter: boolean) {
    if (!selected) return;
    setBusy(true);
    try {
      await fetch("/api/autonomy/approve", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionQueueId: selected,
          decision: "approve",
          executeAfterApprove: executeAfter,
        }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function postReject() {
    if (!selected) return;
    setBusy(true);
    try {
      await fetch("/api/autonomy/approve", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionQueueId: selected, decision: "reject", reason: "ui_reject" }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function postExecute() {
    if (!selected) return;
    setBusy(true);
    try {
      await fetch("/api/autonomy/approve", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionQueueId: selected, decision: "execute" }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function runDry() {
    setBusy(true);
    setRunLog(null);
    try {
      const res = await fetch("/api/autonomy/run", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true, portfolioHints: [{ dealId: "demo", stalled: true }] }),
      });
      const j = (await res.json()) as { summary?: { rationale?: string } };
      setRunLog(j.summary?.rationale ?? "ok");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Autonomous operations</h2>
          <p className="text-xs text-slate-500">
            Draft-only external comms · no auto legal/financial commitments · full audit trail in queue rows.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runDry()}
          className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-950/50 disabled:opacity-40"
        >
          Dry-run pipeline
        </button>
      </div>
      {runLog ? <p className="text-xs text-slate-400">Last dry-run: {runLog}</p> : null}
      {err ? <p className="text-xs text-rose-400">{err}</p> : null}

      <LecipmAutonomyPanel />

      <AutonomySummaryCards
        queued={counts.queued}
        executed={counts.executed}
        blocked={counts.blocked}
        pendingApproval={counts.pendingApproval}
        emergencyFreeze={freeze}
        mode={mode}
      />

      {isAdmin && policies.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-200">Active policies</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {policies.map((p) => (
              <AutonomyPolicyCard
                key={p.id}
                scopeType={p.scopeType}
                scopeKey={p.scopeKey}
                autonomyMode={p.autonomyMode}
                maxRiskLevel={p.maxRiskLevel}
                emergencyFreeze={p.emergencyFreeze}
                version={p.version}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Queue</h3>
        <AutonomyQueueTable
          items={items}
          onSelect={(id) => {
            setSelected(id);
          }}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Selection</h3>
        <ApprovalActionsPanel
          actionQueueId={selected}
          busy={busy}
          onApprove={(ex) => void postApprove(ex)}
          onReject={() => void postReject()}
          onExecute={() => void postExecute()}
        />
        {selectedRow ? (
          <AutonomyActionDetail
            id={selectedRow.id}
            rationale={selectedRow.rationale}
            candidateJson={selectedRow.candidateJson}
          />
        ) : null}
      </section>
    </div>
  );
}
