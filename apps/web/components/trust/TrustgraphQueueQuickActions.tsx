"use client";

import { useState } from "react";

type Props = {
  caseId: string;
};

export function TrustgraphQueueQuickActions({ caseId }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function post(action: string, path: string, body?: Record<string, unknown>) {
    setBusy(action);
    setMsg(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Request failed");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        disabled={!!busy}
        onClick={() => void post("run", `/api/trustgraph/cases/${encodeURIComponent(caseId)}/run`)}
        className="rounded border border-white/15 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-white/10 disabled:opacity-50"
      >
        {busy === "run" ? "…" : "Rerun"}
      </button>
      <button
        type="button"
        disabled={!!busy}
        onClick={() =>
          void post(
            "approve",
            `/api/trustgraph/cases/${encodeURIComponent(caseId)}/actions`,
            { actionType: "approve", notes: "Queue quick approve" }
          )
        }
        className="rounded border border-emerald-500/30 px-2 py-0.5 text-[11px] text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50"
      >
        {busy === "approve" ? "…" : "Approve"}
      </button>
      <button
        type="button"
        disabled={!!busy}
        onClick={() =>
          void post(
            "info",
            `/api/trustgraph/cases/${encodeURIComponent(caseId)}/actions`,
            { actionType: "request_info", notes: "Queue: request info" }
          )
        }
        className="rounded border border-amber-500/30 px-2 py-0.5 text-[11px] text-amber-100 hover:bg-amber-500/10 disabled:opacity-50"
      >
        {busy === "info" ? "…" : "Info"}
      </button>
      {msg ? <span className="text-[11px] text-rose-300">{msg}</span> : null}
    </div>
  );
}
