"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConversionMonitoringState } from "@/modules/conversion/conversion-monitoring.service";
import {
  formatConversionMonitoringSnapshot,
  formatConversionMonitoringVerificationGuide,
} from "@/modules/conversion/conversion-monitoring-verify";
import { deriveConversionExperienceTier, type ConversionExperienceTier } from "@/modules/conversion/conversion-rollout-helpers";

type ApiPayload = {
  flags: {
    FEATURE_CONVERSION_UPGRADE_V1: boolean;
    FEATURE_INSTANT_VALUE_V1: boolean;
    FEATURE_REAL_URGENCY_V1: boolean;
  };
  rollout: { killSwitch: boolean; mode: string };
  experienceTier: ConversionExperienceTier;
  experienceLabel: string;
  monitoring: ConversionMonitoringState | null;
  monitoringNote: string;
  error?: string;
};

function experienceSummaryBullets(flags: ApiPayload["flags"]): string[] {
  const u = flags.FEATURE_CONVERSION_UPGRADE_V1;
  const iv = flags.FEATURE_INSTANT_VALUE_V1;
  const ru = flags.FEATURE_REAL_URGENCY_V1;
  if (!u) return ["Public experience is base conversion only (upgrade flag off)."];
  const lines = [
    "Conversion upgrade is ON — upgraded headline, trust strip, intake, and CTA paths where wired.",
  ];
  if (!iv) lines.push("Instant value tiles are OFF — no three-card insight row on /get-leads; listings instant summary hidden.");
  else lines.push("Instant value is ON — insight tiles and richer summaries where each surface requires both upgrade + IV.");
  if (iv && ru) lines.push("Real urgency is ON — advisory property lines only (recency / session signals), never fabricated countdowns.");
  else if (iv) lines.push("Real urgency is OFF — property advisory demand lines from urgency stack are disabled.");
  return lines;
}

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
  const derivedFromPayload = deriveConversionExperienceTier({
    conversionUpgradeV1: f.FEATURE_CONVERSION_UPGRADE_V1,
    instantValueV1: f.FEATURE_INSTANT_VALUE_V1,
    realUrgencyV1: f.FEATURE_REAL_URGENCY_V1,
  });

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Environment flags (server)</h2>
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

      <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Rollout controls</h2>
        <p className="mt-2 font-mono text-xs text-slate-300">
          killSwitch={String(data.rollout?.killSwitch ?? false)} · mode={data.rollout?.mode ?? "—"}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          See <code className="rounded bg-slate-950 px-1">CONVERSION_ROLLOUT_MODE</code>,{" "}
          <code className="rounded bg-slate-950 px-1">FEATURE_CONVERSION_KILL_SWITCH</code>, and{" "}
          <Link href="/admin/conversion-monitoring" className="text-emerald-400 hover:underline">
            Conversion monitoring
          </Link>
          .
        </p>
      </section>

      <section className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Experience on this deployment</h2>
        <p className="mt-2 font-mono text-[11px] text-emerald-100/90">
          tierKey={derivedFromPayload} · matches API: {String(data.experienceTier === derivedFromPayload)}
        </p>
        <p className="mt-2 text-sm font-medium text-emerald-50">{data.experienceLabel}</p>
        <ul className="mt-4 list-inside list-disc space-y-1.5 text-sm text-emerald-50/95">
          {experienceSummaryBullets(f).map((line, i) => (
            <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200">
          In-process monitoring (this Node.js process)
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

      <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Event verification map</h2>
        <p className="mt-2 text-xs text-slate-500">
          Use for QA — confirm each counter moves when the matching action fires (visitor tab vs server differs; see note
          above).
        </p>
        <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-black/30 p-3 font-mono text-[10px] leading-relaxed text-slate-400">
          {formatConversionMonitoringVerificationGuide()}
        </pre>
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
