"use client";

import type { ConversionMetrics } from "@/src/modules/system-validation/types";

type Props = {
  conversion: ConversionMetrics | null;
};

export function ConversionMetricsPanel({ conversion }: Props) {
  if (!conversion) {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Conversion metrics</h2>
        <p className="mt-2 text-sm text-slate-500">No data.</p>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
      <h2 className="text-lg font-semibold text-slate-100">Conversion metrics</h2>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Activation rate (sample users)</dt>
          <dd className="text-slate-200">{(conversion.activationRate * 100).toFixed(1)}%</dd>
        </div>
        <div>
          <dt className="text-slate-500">Simulator runs (usage counters)</dt>
          <dd className="text-slate-200">{conversion.simulatorRunsObserved}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Drop-off stage</dt>
          <dd className="text-slate-200">{conversion.dropOffStage ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Upgrade wall hit (billing sim)</dt>
          <dd className="text-slate-200">{conversion.upgradeTriggerObserved ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Pro unlock verified</dt>
          <dd className="text-slate-200">{conversion.conversionSimulated ? "yes" : "no"}</dd>
        </div>
      </dl>
    </section>
  );
}
