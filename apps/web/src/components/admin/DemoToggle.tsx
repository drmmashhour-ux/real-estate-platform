"use client";

import { useState } from "react";

type Props = {
  initialRuntimeEnabled: boolean;
  effectiveDemoOn: boolean;
};

/**
 * LECIPM demo runtime toggle (`LECIPM_DEMO_MODE_RUNTIME`). Admin-only via `/api/admin/demo-toggle`.
 */
export function DemoToggle({ initialRuntimeEnabled, effectiveDemoOn }: Props) {
  const [runtimeEnabled, setRuntimeEnabled] = useState(initialRuntimeEnabled);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(next: boolean) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/demo-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
        credentials: "same-origin",
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.message ?? `HTTP ${res.status}`);
      }
      setRuntimeEnabled(next);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toggle failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">LECIPM demo (runtime)</p>
          <p className="mt-1 text-xs text-slate-400">
            <code className="rounded bg-black/30 px-1">LECIPM_DEMO_MODE_RUNTIME</code> — this server process only.
            Independent from Syria / Darlink demo toggles.
          </p>
          <p className="mt-2 text-xs text-slate-300">
            Runtime flag: <strong>{runtimeEnabled ? "ON" : "OFF"}</strong>
            <span className="mx-2 text-slate-600">·</span>
            Effective (FEATURE_* ∪ runtime): <strong>{effectiveDemoOn ? "ON" : "OFF"}</strong>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pending || runtimeEnabled}
            onClick={() => void apply(true)}
            className="rounded-lg border border-amber-500/50 bg-amber-950/40 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-900/40 disabled:opacity-50"
          >
            {pending ? "…" : "Turn runtime ON"}
          </button>
          <button
            type="button"
            disabled={pending || !runtimeEnabled}
            onClick={() => void apply(false)}
            className="rounded-lg border border-white/20 bg-black/30 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/45 disabled:opacity-50"
          >
            {pending ? "…" : "Turn runtime OFF"}
          </button>
        </div>
      </div>
      {error ? <p className="mt-3 text-xs font-medium text-red-400">{error}</p> : null}
    </div>
  );
}
