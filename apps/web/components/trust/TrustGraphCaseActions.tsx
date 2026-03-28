"use client";

import { useState } from "react";

export function TrustGraphCaseActions({ caseId }: { caseId: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function post(path: string, body: Record<string, unknown>) {
    setBusy(path);
    setMsg(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Failed");
        return;
      }
      setMsg("Saved.");
      window.location.reload();
    } finally {
      setBusy(null);
    }
  }

  async function rerun() {
    setBusy("run");
    setMsg(null);
    try {
      const res = await fetch(`/api/trustgraph/cases/${encodeURIComponent(caseId)}/run`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Run failed");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-premium-gold/30 bg-[#1a1508]/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Human review</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => void rerun()}
          className="rounded-lg border border-sky-500/30 px-3 py-1.5 text-xs text-sky-100 hover:bg-sky-500/10 disabled:opacity-50"
        >
          {busy === "run" ? "…" : "Rerun pipeline"}
        </button>
        {(["approve", "reject", "request_info", "escalate"] as const).map((a) => (
          <button
            key={a}
            type="button"
            disabled={!!busy}
            onClick={() =>
              void post(`/api/trustgraph/cases/${encodeURIComponent(caseId)}/actions`, {
                actionType: a,
                notes: `Admin action: ${a}`,
              })
            }
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-50"
          >
            {busy ? "…" : a}
          </button>
        ))}
        <button
          type="button"
          disabled={!!busy}
          onClick={() => {
            const assignedToId = window.prompt("Assign to user id (UUID)");
            if (!assignedToId?.trim()) return;
            void post(`/api/trustgraph/cases/${encodeURIComponent(caseId)}/actions`, {
              actionType: "assign",
              notes: "Assign reviewer",
              payload: { assignedToId: assignedToId.trim() },
            });
          }}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-50"
        >
          assign
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs text-slate-400">{msg}</p> : null}
    </div>
  );
}
