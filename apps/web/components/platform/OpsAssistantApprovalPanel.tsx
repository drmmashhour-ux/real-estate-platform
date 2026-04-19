"use client";

import { useCallback, useMemo, useState } from "react";

import type { ApprovalAuditEntry, ApprovalExecutionRequest } from "@/modules/platform/ops-assistant/approval-execution.types";

function StatusTone({ status }: { status: ApprovalExecutionRequest["status"] }) {
  const cls =
    status === "pending"
      ? "border-amber-700 bg-amber-950/50 text-amber-100"
      : status === "approved"
        ? "border-sky-700 bg-sky-950/50 text-sky-100"
        : status === "executed"
          ? "border-emerald-700 bg-emerald-950/40 text-emerald-100"
          : status === "failed"
            ? "border-rose-700 bg-rose-950/40 text-rose-100"
            : status === "denied" || status === "cancelled"
              ? "border-zinc-600 bg-zinc-900 text-zinc-400"
              : "border-slate-600 bg-slate-900 text-slate-200";
  return (
    <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

async function postApproval(body: Record<string, string>): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch("/api/platform/ops-assistant/approval", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok) return { error: json.error ?? res.statusText };
  return json;
}

export function OpsAssistantApprovalPanel({
  initialRequests,
  initialAudit,
  killSwitch,
  mutationsEnabled,
}: {
  initialRequests: ApprovalExecutionRequest[];
  initialAudit: ApprovalAuditEntry[];
  killSwitch: boolean;
  mutationsEnabled: boolean;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [audit, setAudit] = useState(initialAudit);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/ops-assistant/approval");
      const json = (await res.json()) as { requests?: ApprovalExecutionRequest[]; audit?: ApprovalAuditEntry[] };
      if (json.requests) setRequests(json.requests);
      if (json.audit) setAudit(json.audit);
    } catch {
      /* ignore */
    }
  }, []);

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const approvedQueue = useMemo(() => requests.filter((r) => r.status === "approved"), [requests]);
  const recentDone = useMemo(
    () =>
      requests.filter((r) =>
        ["executed", "failed", "denied", "cancelled"].includes(r.status),
      ),
    [requests],
  );

  const run = async (label: string, body: Record<string, string>, confirmFirst?: string) => {
    if (confirmFirst && typeof window !== "undefined" && !window.confirm(confirmFirst)) return;
    setBusy(label);
    setMsg(null);
    const out = await postApproval(body);
    setBusy(null);
    if (out.error) {
      setMsg(out.error);
      return;
    }
    setMsg("Updated.");
    await refresh();
  };

  return (
    <div className="rounded-lg border border-violet-900/40 bg-violet-950/15 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-300">Approval execution queue</h2>
      <p className="mt-1 text-[11px] text-slate-500">
        Approval-based runs only — suggest-only shortcuts still work beside each priority. Nothing executes without explicit
        approve → run.{" "}
        <span className="text-slate-400">
          Nothing happens until you approve <span className="text-slate-300">(pending → approved → execute).</span>
        </span>
      </p>

      {killSwitch ? (
        <p className="mt-2 rounded border border-rose-900/50 bg-rose-950/30 px-2 py-1.5 text-[11px] text-rose-200">
          Kill switch active (FEATURE_OPS_ASSISTANT_APPROVAL_KILL_SWITCH) — mutations are blocked from the API.
        </p>
      ) : null}
      {!mutationsEnabled ? (
        <p className="mt-2 text-[11px] text-amber-200/90">
          Enable FEATURE_OPS_ASSISTANT_APPROVAL_EXECUTION_V1 to queue and run approved internal actions.
        </p>
      ) : null}

      {msg ? <p className="mt-2 text-xs text-emerald-400/90">{msg}</p> : null}

      <section className="mt-4 space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pending approval</h3>
        {pending.length === 0 ? (
          <p className="text-[11px] text-slate-500">No pending requests.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((r) => (
              <li key={r.id} className="rounded border border-slate-800 bg-slate-950/40 p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-100">{r.description.slice(0, 160)}</span>
                  <StatusTone status={r.status} />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Action · <span className="text-slate-400">{r.actionType}</span> · Risk ·{" "}
                  <span className="text-emerald-400">{r.riskLevel}</span>
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Reversible after run when undo is supported for this action type (internal drafts, tasks, tags,
                  reminders, most config drafts; workflow revert when transition rules allow).
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(busy) || !mutationsEnabled || killSwitch}
                    className="rounded bg-emerald-800 px-2 py-1 text-[11px] text-white hover:bg-emerald-700 disabled:opacity-40"
                    onClick={() =>
                      void run(`ap-${r.id}`, { action: "approve", requestId: r.id })
                    }
                  >
                    Approve…
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busy) || !mutationsEnabled || killSwitch}
                    className="rounded border border-slate-600 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                    onClick={() => void run(`dn-${r.id}`, { action: "deny", requestId: r.id })}
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Approved — execute</h3>
        {approvedQueue.length === 0 ? (
          <p className="text-[11px] text-slate-500">Nothing approved waiting to run.</p>
        ) : (
          <ul className="space-y-2">
            {approvedQueue.map((r) => (
              <li key={`ex-${r.id}`} className="rounded border border-sky-900/40 bg-sky-950/20 p-2">
                <p className="text-xs text-sky-100">{r.description.slice(0, 200)}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Exact effect: internal-only artifact or workflow transition as described — no Stripe, bookings, ads, or
                  ranking engine changes through this layer.
                </p>
                <button
                  type="button"
                  disabled={Boolean(busy) || !mutationsEnabled || killSwitch}
                  className="mt-2 rounded bg-violet-700 px-2 py-1 text-[11px] text-white hover:bg-violet-600 disabled:opacity-40"
                  onClick={() =>
                    void run(
                      `run-${r.id}`,
                      { action: "execute", requestId: r.id },
                      [
                        "Confirm execution of this one internal low-risk action?",
                        "",
                        "No Stripe, bookings, ads, ranking, or pricing changes — only the described internal artifact or workflow step.",
                      ].join("\n"),
                    )
                  }
                >
                  Execute now
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-5 space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Recent outcomes</h3>
        {recentDone.length === 0 ? (
          <p className="text-[11px] text-slate-500">No completed rows yet.</p>
        ) : (
          <ul className="space-y-2 text-[11px] text-slate-400">
            {recentDone.slice(0, 12).map((r) => (
              <li key={`lo-${r.id}`} className="rounded border border-slate-800/80 bg-slate-950/30 px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusTone status={r.status} />
                  <span className="text-slate-500">{new Date(r.createdAt).toLocaleString()}</span>
                  {r.approvedBy ? (
                    <span className="text-slate-500">
                      approved by <span className="text-slate-300">{r.approvedBy.slice(0, 10)}…</span>
                    </span>
                  ) : null}
                  {r.executedBy ? (
                    <span className="text-slate-500">
                      ran by <span className="text-slate-300">{r.executedBy.slice(0, 10)}…</span>
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-slate-300">{r.description.slice(0, 180)}</p>
                {r.lastError ? <p className="text-rose-300/90">Error: {r.lastError}</p> : null}
                {r.status === "executed" ? (
                  <button
                    type="button"
                    disabled={Boolean(busy) || !mutationsEnabled || killSwitch}
                    className="mt-1 rounded border border-slate-600 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                    onClick={() => void run(`un-${r.id}`, { action: "undo", requestId: r.id })}
                  >
                    Undo (when supported)
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Audit tail</h3>
        <ul className="mt-1 max-h-40 overflow-y-auto text-[10px] text-slate-500">
          {audit.slice(0, 40).map((a) => (
            <li key={a.id} className="border-b border-slate-800/60 py-1">
              <span className="text-slate-400">{new Date(a.at).toLocaleString()}</span> — {a.kind.replace(/_/g, " ")} —{" "}
              <span className="text-slate-300">{a.actionType}</span> — {a.explanation.slice(0, 120)}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-2 text-[10px] text-violet-400 underline decoration-violet-700 hover:text-violet-300"
          onClick={() => void refresh()}
        >
          Refresh queue
        </button>
      </section>
    </div>
  );
}
