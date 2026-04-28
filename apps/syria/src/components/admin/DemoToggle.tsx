"use client";

import { useState } from "react";

type Props = {
  initialRuntimeEnabled: boolean;
  effectiveDemoOn: boolean;
  /** Present after demo auto-disable via DR.BRAIN CRITICAL failsafe (until operator clears by turning demo ON). */
  autoDisabledReason?: string | null;
  autoDisabledAt?: string | null;
};

/**
 * Syria investor demo runtime toggle (INVESTOR_DEMO_MODE_RUNTIME). Admin-only via API + session.
 */
export function DemoToggle({
  initialRuntimeEnabled,
  effectiveDemoOn,
  autoDisabledReason,
  autoDisabledAt,
}: Props) {
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

  const showAutoBanner = Boolean(autoDisabledReason?.trim());

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 [dir=rtl]:text-right">
      {showAutoBanner ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-950"
        >
          ⚠️ Demo mode was automatically disabled due to system risk.
          {autoDisabledAt ? (
            <span className="mt-1 block text-xs font-normal text-red-900/85">{autoDisabledAt}</span>
          ) : null}
          <span className="mt-1 block text-xs font-normal text-red-900/90">{autoDisabledReason}</span>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-amber-950">Syria investor demo (runtime)</p>
          <p className="mt-1 text-xs text-amber-900/85">
            <code className="rounded bg-white/70 px-1">INVESTOR_DEMO_MODE_RUNTIME</code> — this server process only.
            Effective demo also requires hosting env rules (e.g.{" "}
            <code className="rounded bg-white/70 px-1">INVESTOR_DEMO_IN_PRODUCTION</code> on Vercel prod).
          </p>
          <p className="mt-2 text-xs text-stone-700">
            Runtime flag: <strong>{runtimeEnabled ? "ON" : "OFF"}</strong>
            <span className="mx-2 text-stone-400">·</span>
            Effective demo UX: <strong>{effectiveDemoOn ? "ON" : "OFF"}</strong>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pending || runtimeEnabled}
            onClick={() => void apply(true)}
            className="rounded-xl border border-amber-400 bg-amber-200 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-300 disabled:opacity-50"
          >
            {pending ? "…" : "Turn runtime ON"}
          </button>
          <button
            type="button"
            disabled={pending || !runtimeEnabled}
            onClick={() => void apply(false)}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
          >
            {pending ? "…" : "Turn runtime OFF"}
          </button>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
