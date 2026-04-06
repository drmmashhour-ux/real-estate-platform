"use client";

import { useCallback, useEffect, useState } from "react";

type EnvPayload = {
  env: { enabled: boolean; safeMode: boolean; envAllowsExecution: boolean };
  paused: boolean;
  effective: boolean;
};

type AuditRow = {
  id: string;
  actionType: string;
  targetType: string;
  targetId: string;
  safeMode: boolean;
  detail: unknown;
  revertedAt: string | null;
  createdAt: string;
};

export function AutoCloseAdminClient() {
  const [settings, setSettings] = useState<EnvPayload | null>(null);
  const [events, setEvents] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        fetch("/api/admin/autoclose/settings"),
        fetch("/api/admin/autoclose/audit"),
      ]);
      if (s.ok) setSettings((await s.json()) as EnvPayload);
      if (a.ok) {
        const j = (await a.json()) as { events: AuditRow[] };
        setEvents(j.events ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function togglePaused() {
    if (!settings) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/autoclose/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: !settings.paused }),
      });
      if (res.ok) {
        const j = (await res.json()) as { paused: boolean; effective: boolean };
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                paused: j.paused,
                effective: j.effective,
              }
            : prev
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function runOnce() {
    setBusy(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/admin/autoclose/run-once", { method: "POST" });
      const j = (await res.json()) as Record<string, unknown>;
      setRunResult(JSON.stringify(j, null, 2));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function revert(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/autoclose/audit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revert: true }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-sm font-semibold text-white">Controls</h2>
        {loading ? (
          <p className="mt-2 text-sm text-slate-500">Loading…</p>
        ) : settings ? (
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>
              <span className="text-slate-500">AI_AUTOCLOSE_ENABLED:</span>{" "}
              <code className="text-amber-200/90">{settings.env.enabled ? "1" : "0"}</code>
            </p>
            <p>
              <span className="text-slate-500">AI_AUTOCLOSE_SAFE_MODE:</span>{" "}
              <code className="text-amber-200/90">{settings.env.safeMode ? "1" : "0"}</code>
            </p>
            <p>
              <span className="text-slate-500">Env allows execution:</span>{" "}
              <span className={settings.env.envAllowsExecution ? "text-emerald-400" : "text-rose-400"}>
                {settings.env.envAllowsExecution ? "yes" : "no"}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Paused (override):</span>{" "}
              <span className={settings.paused ? "text-rose-300" : "text-emerald-300"}>
                {settings.paused ? "yes" : "no"}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Effective (will run on cron):</span>{" "}
              <span className={settings.effective ? "text-emerald-300" : "text-slate-500"}>
                {settings.effective ? "yes" : "no"}
              </span>
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void togglePaused()}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                {settings.paused ? "Resume auto-close" : "Pause auto-close"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runOnce()}
                className="rounded-lg bg-violet-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
              >
                Run pass now
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Cron: <code className="text-slate-500">POST /api/cron/auto-close-worker</code> with{" "}
              <code className="text-slate-500">Authorization: Bearer CRON_SECRET</code>. Safe actions only: in-app
              inactivity nudge (high-intent threads), CRM lead reactivation flags, internal booking reminder events (no
              guest payment copy).
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-rose-400">Could not load settings.</p>
        )}
        {runResult ? (
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-400">{runResult}</pre>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-sm font-semibold text-white">Recent audit</h2>
        <p className="mt-1 text-xs text-slate-500">
          Revert marks the row only (messages are not unsent). Use for compliance / operator notes.
        </p>
        <div className="mt-4 max-h-[420px] overflow-auto text-xs">
          <table className="w-full border-collapse text-left text-slate-300">
            <thead>
              <tr className="border-b border-slate-700 text-slate-500">
                <th className="py-1 pr-2">When</th>
                <th className="py-1 pr-2">Action</th>
                <th className="py-1 pr-2">Target</th>
                <th className="py-1 pr-2">Safe</th>
                <th className="py-1"> </th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-slate-800/80">
                  <td className="py-1 pr-2 text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="py-1 pr-2 font-mono text-[11px]">{e.actionType}</td>
                  <td className="py-1 pr-2 font-mono text-[11px]">
                    {e.targetType}:{e.targetId.slice(0, 8)}…
                  </td>
                  <td className="py-1 pr-2">{e.safeMode ? "yes" : "no"}</td>
                  <td className="py-1">
                    {e.revertedAt ? (
                      <span className="text-slate-600">reverted</span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void revert(e.id)}
                        className="text-amber-400/90 underline disabled:opacity-50"
                      >
                        Revert flag
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 ? <p className="py-4 text-slate-600">No events yet.</p> : null}
        </div>
      </div>

      <p className="text-xs font-medium tracking-wide text-emerald-400/90">LECIPM AUTO CLOSE SAFE MODE ACTIVE</p>
    </div>
  );
}
