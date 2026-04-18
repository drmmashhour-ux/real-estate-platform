"use client";

import { useCallback, useEffect, useState } from "react";
import { formatConversionMonitoringSnapshot } from "@/modules/conversion/conversion-monitoring-verify";

type ApiPayload = {
  flags: {
    FEATURE_CONVERSION_UPGRADE_V1: boolean;
    FEATURE_INSTANT_VALUE_V1: boolean;
    FEATURE_REAL_URGENCY_V1: boolean;
  };
  experienceTier: string;
  experienceLabel: string;
  monitoring: Record<string, number> | null;
  monitoringNote: string;
  error?: string;
};

export function ConversionRolloutAdminClient() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/conversion-rollout", { credentials: "same-origin" });
      const j = (await res.json()) as ApiPayload & { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed to load");
      setData(j);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setData(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!data) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  const f = data.flags;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Environment flags</h2>
        <table className="mt-4 w-full text-left text-sm text-slate-200">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase text-slate-500">
              <th className="py-2 pr-4">Variable</th>
              <th className="py-2">On</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-800/80">
              <td className="py-2 pr-4 font-mono text-xs text-slate-300">FEATURE_CONVERSION_UPGRADE_V1</td>
              <td className="py-2">{f.FEATURE_CONVERSION_UPGRADE_V1 ? "✓" : "—"}</td>
            </tr>
            <tr className="border-b border-slate-800/80">
              <td className="py-2 pr-4 font-mono text-xs text-slate-300">FEATURE_INSTANT_VALUE_V1</td>
              <td className="py-2">{f.FEATURE_INSTANT_VALUE_V1 ? "✓" : "—"}</td>
            </tr>
            <tr className="border-b border-slate-800/80">
              <td className="py-2 pr-4 font-mono text-xs text-slate-300">FEATURE_REAL_URGENCY_V1</td>
              <td className="py-2">{f.FEATURE_REAL_URGENCY_V1 ? "✓" : "—"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Effective experience tier</h2>
        <p className="mt-2 font-mono text-xs text-emerald-100/90">{data.experienceTier}</p>
        <p className="mt-2 text-sm text-emerald-50/90">{data.experienceLabel}</p>
      </section>

      <section className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200">
          In-process monitoring (server runtime)
        </h2>
        <p className="mt-2 text-xs text-slate-400">{data.monitoringNote}</p>
        {data.monitoring ? (
          <pre className="mt-4 overflow-x-auto rounded-lg border border-slate-800 bg-black/40 p-3 font-mono text-[11px] text-slate-300">
            {formatConversionMonitoringSnapshot(data.monitoring)}
          </pre>
        ) : (
          <p className="mt-2 text-xs text-slate-500">No snapshot</p>
        )}
      </section>

      <button
        type="button"
        onClick={() => void load()}
        className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Refresh
      </button>
    </div>
  );
}
