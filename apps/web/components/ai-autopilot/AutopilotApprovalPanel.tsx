"use client";

import * as React from "react";

export function AutopilotApprovalPanel(props: {
  id: string;
  status: string;
  riskLevel: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = React.useState(false);

  async function post(path: string) {
    setBusy(true);
    try {
      const res = await fetch(path, { method: "POST" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Request failed");
      }
      props.onDone();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (props.status === "executed" || props.status === "rejected" || props.status === "archived") {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => void post(`/api/autopilot/actions/${props.id}/approve`)}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void post(`/api/autopilot/actions/${props.id}/reject`)}
        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
      >
        Reject
      </button>
      {props.riskLevel === "LOW" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void post(`/api/autopilot/actions/${props.id}/execute`)}
          className="rounded-lg border border-emerald-800 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-950 disabled:opacity-50"
        >
          Execute safe (v1 stub)
        </button>
      ) : null}
    </div>
  );
}
