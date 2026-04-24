"use client";

import * as React from "react";
import Link from "next/link";
import { offerDraftApproveActionId } from "@/modules/broker-action-risk/action-id";

type DraftPayload = {
  id: string;
  status: string;
  purchasePrice: number;
  depositAmount: number | null;
  financingDeadline: string | null;
  inspectionDeadline: string | null;
  occupancyDate: string | null;
  includedItemsJson: unknown;
  excludedItemsJson: unknown;
  specialConditionsJson: unknown;
  rationaleJson: unknown;
  priceBandsJson: unknown;
  clauseWarningsJson: unknown;
  financingClauseText: string | null;
  inspectionClauseText: string | null;
  occupancyClauseText: string | null;
  promiseArtifactId: string | null;
  approvedAt: string | null;
  sentAt: string | null;
};

export function OfferDraftDashboardClient({ dealId }: { dealId: string }) {
  const [draft, setDraft] = React.useState<DraftPayload | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [actionRisk, setActionRisk] = React.useState<{
    riskLevel: string;
    riskScore: number;
    warnings: string[];
    blockers: string[];
    hardBlocked: boolean;
  } | null>(null);
  const [riskBusy, setRiskBusy] = React.useState(false);

  const [purchasePrice, setPurchasePrice] = React.useState("");
  const [depositAmount, setDepositAmount] = React.useState("");
  const [financingClause, setFinancingClause] = React.useState("");
  const [inspectionClause, setInspectionClause] = React.useState("");
  const [occupancyClause, setOccupancyClause] = React.useState("");
  const [executedAutopilotPipelines, setExecutedAutopilotPipelines] = React.useState<{ id: string; type: string }[]>([]);
  const [autopilotPipelineIdForSend, setAutopilotPipelineIdForSend] = React.useState("");

  const loadExecutedAutopilotPipelines = React.useCallback(async () => {
    const r = await fetch(`/api/action-pipeline?dealId=${encodeURIComponent(dealId)}`, { credentials: "include" });
    const j = await r.json();
    if (!r.ok) return;
    const items = (j.items ?? []) as { id: string; type: string; status: string }[];
    setExecutedAutopilotPipelines(
      items.filter((x) => x.status === "EXECUTED" && (x.type === "DEAL" || x.type === "DOCUMENT")),
    );
  }, [dealId]);

  const load = React.useCallback(async () => {
    setErr(null);
    const r = await fetch(`/api/deals/${dealId}/offer-draft`, { credentials: "include" });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error ?? "Load failed");
      setDraft(null);
      return;
    }
    const d = j.draft as DraftPayload | null;
    setDraft(d);
    if (d) {
      setPurchasePrice(String(d.purchasePrice));
      setDepositAmount(d.depositAmount != null ? String(d.depositAmount) : "");
      setFinancingClause(d.financingClauseText ?? "");
      setInspectionClause(d.inspectionClauseText ?? "");
      setOccupancyClause(d.occupancyClauseText ?? "");
    }
  }, [dealId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    void loadExecutedAutopilotPipelines();
  }, [loadExecutedAutopilotPipelines, draft?.status]);

  const refreshActionRisk = React.useCallback(
    async (draftId: string) => {
      setRiskBusy(true);
      try {
        const aid = offerDraftApproveActionId(dealId, draftId);
        const r = await fetch(`/api/actions/${encodeURIComponent(aid)}/risk`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const j = await r.json();
        if (!r.ok) {
          setActionRisk(null);
          return;
        }
        setActionRisk({
          riskLevel: j.riskLevel as string,
          riskScore: j.riskScore as number,
          warnings: (j.warnings as string[]) ?? [],
          blockers: (j.blockers as string[]) ?? [],
          hardBlocked: Boolean(j.hardBlocked),
        });
      } finally {
        setRiskBusy(false);
      }
    },
    [dealId],
  );

  React.useEffect(() => {
    if (!draft || draft.status === "SENT") {
      setActionRisk(null);
      return;
    }
    void refreshActionRisk(draft.id);
  }, [draft?.id, draft?.status, refreshActionRisk]);

  async function generate() {
    setBusy("gen");
    setErr(null);
    try {
      const r = await fetch(`/api/deals/${dealId}/offer-draft/generate`, {
        method: "POST",
        credentials: "include",
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error ?? "Generate failed");
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!draft) return;
    setBusy("save");
    setErr(null);
    try {
      const r = await fetch(`/api/deals/${dealId}/offer-draft/update`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draft.id,
          patch: {
            purchasePrice: Number(purchasePrice),
            depositAmount: depositAmount === "" ? null : Number(depositAmount),
            financingClauseText: financingClause,
            inspectionClauseText: inspectionClause,
            occupancyClauseText: occupancyClause,
          },
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error ?? "Save failed");
        return;
      }
      await load();
      await refreshActionRisk(draft.id);
    } finally {
      setBusy(null);
    }
  }

  async function approve() {
    if (!draft) return;
    setBusy("appr");
    setErr(null);
    try {
      const r = await fetch(`/api/deals/${dealId}/offer-draft/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id, brokerConfirmed: true }),
      });
      const j = await r.json();
      if (!r.ok) {
        const blockers = Array.isArray(j.blockers) ? (j.blockers as string[]).join(" · ") : "";
        setErr(
          j.error === "APPROVAL_RISK_BLOCKED" && blockers ?
            `Approval blocked: ${blockers}`
          : (j.error ?? "Approve failed"),
        );
        if (j.riskLevel != null) {
          setActionRisk({
            riskLevel: String(j.riskLevel),
            riskScore: Number(j.riskScore ?? 0),
            warnings: Array.isArray(j.warnings) ? (j.warnings as string[]) : [],
            blockers: Array.isArray(j.blockers) ? (j.blockers as string[]) : [],
            hardBlocked: Array.isArray(j.blockers) && j.blockers.length > 0,
          });
        }
        return;
      }
      await load();
      if (j.nextStep) {
        setErr(null);
      }
    } finally {
      setBusy(null);
    }
  }

  async function send() {
    if (!draft) return;
    setBusy("send");
    setErr(null);
    try {
      const r = await fetch(`/api/deals/${dealId}/offer-draft/send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id, channel: "EMAIL" }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error ?? "Send blocked — complete promise approval + broker sign on legal artifact first.");
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  const warnings = Array.isArray(draft?.clauseWarningsJson) ? (draft!.clauseWarningsJson as string[]) : [];
  const priceBands = draft?.priceBandsJson as
    | { aggressive?: number; balanced?: number; safe?: number; selected?: string }
    | undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Auto offer draft (Québec)</h1>
          <p className="text-muted-foreground font-mono text-xs">{dealId}</p>
          <p className="text-muted-foreground mt-2 max-w-2xl text-xs">
            AI prepares clauses and amounts for broker review only. Nothing is sent automatically. Approve here creates a
            Promise-to-Purchase artifact; you must still complete digital sign-off on the legal document before Send.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/deals/${dealId}/action-pipeline`} className="rounded-md border px-3 py-1.5 text-xs">
            Autopilot actions (sign)
          </Link>
          <Link href={`/dashboard/deals/${dealId}/playbook`} className="rounded-md border px-3 py-1.5 text-xs">
            First deal playbook
          </Link>
          <Link href={`/dashboard/deals/${dealId}/investors`} className="rounded-md border px-3 py-1.5 text-xs">
            Deal investors
          </Link>
          <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => void load()}>
            Refresh
          </button>
          <button
            type="button"
            disabled={busy !== null}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
            onClick={() => void generate()}
          >
            {busy === "gen" ? "Generating…" : "Generate / refresh AI draft"}
          </button>
        </div>
      </div>

      {err ? <p className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-900">{err}</p> : null}

      {actionRisk && (actionRisk.riskLevel === "HIGH" || actionRisk.blockers.length > 0) ?
        <div className="rounded-lg border-2 border-red-700 bg-red-50 p-4 text-red-950">
          <p className="text-sm font-bold">⚠️ HIGH RISK ACTION</p>
          <p className="mt-1 text-xs">
            Score {actionRisk.riskScore}/100 · {actionRisk.blockers.length > 0 ? "Critical issues block approval" : "Elevated risk — review warnings before approving."}
          </p>
          {actionRisk.blockers.length > 0 ?
            <ul className="mt-2 list-inside list-disc text-xs font-medium">
              {actionRisk.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          : null}
          {actionRisk.warnings.length > 0 ?
            <ul className="mt-2 list-inside list-disc text-xs text-red-900/90">
              {actionRisk.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          : null}
        </div>
      : actionRisk && actionRisk.warnings.length > 0 ?
        <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-4 text-amber-950">
          <p className="text-xs font-semibold">Risk check (score {actionRisk.riskScore})</p>
          <ul className="mt-2 list-inside list-disc text-xs">
            {actionRisk.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      : null}
      {riskBusy ?
        <p className="text-muted-foreground text-[11px]">Refreshing pre-approval risk…</p>
      : null}

      {!draft ?
        <p className="text-muted-foreground text-xs">No draft yet — generate from deal + listing context.</p>
      : <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
            <span className="text-xs font-medium uppercase text-muted-foreground">Status: {draft.status}</span>
            {draft.promiseArtifactId ?
              <span className="font-mono text-[10px] text-muted-foreground">Artifact {draft.promiseArtifactId.slice(0, 12)}…</span>
            : null}
          </div>

          {priceBands ?
            <div className="rounded-lg border bg-muted/20 p-3 text-xs">
              <p className="font-semibold">Price ladder (CAD)</p>
              <p>
                Aggressive: {priceBands.aggressive ?? "—"} · Balanced: {priceBands.balanced ?? "—"} · Safe:{" "}
                {priceBands.safe ?? "—"} · Selected: {priceBands.selected ?? "BALANCED"}
              </p>
            </div>
          : null}

          {warnings.length ?
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <p className="text-xs font-semibold text-amber-900">Clause warnings</p>
              <ul className="mt-1 list-inside list-disc text-xs text-amber-900">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          : null}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span className="font-medium">Purchase price (CAD)</span>
              <input
                className="w-full rounded border bg-background p-2"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                disabled={draft.status === "SENT"}
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Deposit (CAD)</span>
              <input
                className="w-full rounded border bg-background p-2"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={draft.status === "SENT"}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3 text-xs text-muted-foreground">
            <div>Financing deadline: {draft.financingDeadline?.slice(0, 10) ?? "—"}</div>
            <div>Inspection deadline: {draft.inspectionDeadline?.slice(0, 10) ?? "—"}</div>
            <div>Occupancy target: {draft.occupancyDate?.slice(0, 10) ?? "—"}</div>
          </div>

          <label className="space-y-1 text-xs">
            <span className="font-medium">Financing clause</span>
            <textarea
              className="min-h-[100px] w-full rounded border bg-background p-2 font-mono text-[11px]"
              value={financingClause}
              onChange={(e) => setFinancingClause(e.target.value)}
              disabled={draft.status === "SENT"}
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Inspection clause</span>
            <textarea
              className="min-h-[100px] w-full rounded border bg-background p-2 font-mono text-[11px]"
              value={inspectionClause}
              onChange={(e) => setInspectionClause(e.target.value)}
              disabled={draft.status === "SENT"}
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Occupancy clause</span>
            <textarea
              className="min-h-[80px] w-full rounded border bg-background p-2 font-mono text-[11px]"
              value={occupancyClause}
              onChange={(e) => setOccupancyClause(e.target.value)}
              disabled={draft.status === "SENT"}
            />
          </label>

          <details className="rounded border p-3">
            <summary className="cursor-pointer text-xs font-medium">AI rationale & traceability (JSON)</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-[10px]">
              {JSON.stringify(draft.rationaleJson, null, 2)}
            </pre>
          </details>

          {draft.status === "APPROVED" && executedAutopilotPipelines.length > 0 ?
            <label className="block space-y-1 rounded-lg border border-dashed p-3 text-xs">
              <span className="font-medium">Executed AI autopilot action (link to offer send)</span>
              <p className="text-[11px] text-muted-foreground">
                Optional unless <code className="rounded bg-muted px-1">SIGNATURE_CONTROL_REQUIRE_EXECUTED_PIPELINE_FOR_OFFER_SEND</code>{" "}
                is enabled. Choose a broker-signed <strong>EXECUTED</strong> DEAL/DOCUMENT pipeline to attach to this dispatch audit.
              </p>
              <select
                className="mt-1 w-full max-w-md rounded border bg-background p-2 text-xs"
                value={autopilotPipelineIdForSend}
                onChange={(e) => setAutopilotPipelineIdForSend(e.target.value)}
              >
                <option value="">— None —</option>
                {executedAutopilotPipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.type} · {p.id.slice(0, 12)}…
                  </option>
                ))}
              </select>
            </label>
          : null}

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <button
              type="button"
              disabled={busy !== null || draft.status === "SENT"}
              className="rounded-md border px-3 py-2 text-xs"
              onClick={() => void save()}
            >
              {busy === "save" ? "Saving…" : "Save edits"}
            </button>
            <button
              type="button"
              disabled={
                busy !== null ||
                (draft.status === "APPROVED" && !!draft.promiseArtifactId) ||
                draft.status === "SENT" ||
                (actionRisk?.hardBlocked ?? false)
              }
              className="rounded-md border border-amber-700 px-3 py-2 text-xs text-amber-900 disabled:opacity-40"
              onClick={() => void approve()}
              title={
                actionRisk?.hardBlocked ? "Resolve critical risk flags (or admin override via API) before approval." : undefined
              }
            >
              {busy === "appr" ? "Approving…" : "Approve & create promise (legal engine)"}
            </button>
            <button
              type="button"
              disabled={busy !== null || draft.status !== "APPROVED" || draft.status === "SENT"}
              className="rounded-md bg-emerald-800 px-3 py-2 text-xs text-white disabled:opacity-40"
              onClick={() => void send()}
            >
              {busy === "send" ? "Sending…" : "Send (requires signed promise)"}
            </button>
          </div>
          {draft.sentAt ?
            <p className="text-xs text-emerald-800">Sent at {draft.sentAt}</p>
          : null}
        </div>
      }
    </div>
  );
}
