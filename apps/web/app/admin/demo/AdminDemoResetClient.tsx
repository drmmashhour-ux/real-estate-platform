"use client";

import { useState } from "react";

export function AdminDemoResetClient() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function runReset() {
    if (!window.confirm("Truncate the staging database and re-seed? This cannot be undone.")) return;
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/demo/reset", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok || !j.ok) {
        setErr(j.error ?? "Reset failed");
        return;
      }
      setMsg("Reset completed. Refresh the app to see fresh demo data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={loading}
        onClick={() => void runReset()}
        className="rounded-xl border border-amber-500/50 bg-amber-950/40 px-4 py-2 text-sm font-semibold text-amber-100 disabled:opacity-50"
      >
        {loading ? "Resetting…" : "Reset demo database now"}
      </button>
      {err ? <p className="text-xs text-red-400">{err}</p> : null}
      {msg ? <p className="text-xs text-emerald-300">{msg}</p> : null}
      <p className="text-[11px] text-slate-500">
        Requires <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_ENV=staging</code> on the server. Daily cron uses{" "}
        <code className="rounded bg-black/30 px-1">GET /api/cron/reset-demo</code> with <code className="rounded bg-black/30 px-1">Authorization: Bearer CRON_SECRET</code>.
      </p>
    </div>
  );
}
