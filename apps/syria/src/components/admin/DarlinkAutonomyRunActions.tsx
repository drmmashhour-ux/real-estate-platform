"use client";

import { useState } from "react";

/** Triggers dry-run pipeline from the browser — admin session cookie required. */

export function DarlinkAutonomyRunActions() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runDryRun() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/autonomy/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true, portfolio: true }),
      });
      const data = await res.json();
      setStatus(res.ok ? `OK · signals=${data.result?.signalsCount ?? "?"}` : `Error ${res.status}`);
    } catch {
      setStatus("request_failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">Run pipeline</h3>
      <p className="mt-1 text-xs text-stone-600">
        Default is dry-run — no live mutations. Enable automation only via env flags after policy review.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={() => void runDryRun()}
        className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
      >
        {loading ? "Running…" : "Run dry-run autonomy"}
      </button>
      {status ? <p className="mt-2 font-mono text-xs text-stone-700">{status}</p> : null}
    </div>
  );
}
