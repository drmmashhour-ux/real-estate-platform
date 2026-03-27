"use client";

import type { SimulationDiffRow } from "@/modules/model-tuning/domain/tuning.types";

function regressed(d: SimulationDiffRow): boolean {
  const ta = d.after.trustAgreement === true ? 1 : d.after.trustAgreement === false ? 0 : 0.5;
  const tb = d.before.trustAgreement === true ? 1 : d.before.trustAgreement === false ? 0 : 0.5;
  const da = d.after.dealAgreement === true ? 1 : d.after.dealAgreement === false ? 0 : 0.5;
  const db = d.before.dealAgreement === true ? 1 : d.before.dealAgreement === false ? 0 : 0.5;
  return ta + da < tb + db;
}

function improved(d: SimulationDiffRow): boolean {
  const ta = d.after.trustAgreement === true ? 1 : d.after.trustAgreement === false ? 0 : 0.5;
  const tb = d.before.trustAgreement === true ? 1 : d.before.trustAgreement === false ? 0 : 0.5;
  const da = d.after.dealAgreement === true ? 1 : d.after.dealAgreement === false ? 0 : 0.5;
  const db = d.before.dealAgreement === true ? 1 : d.before.dealAgreement === false ? 0 : 0.5;
  return ta + da > tb + db;
}

export function TuningSimulationResults({ diffs }: { diffs: SimulationDiffRow[] }) {
  const regressions = diffs.filter(regressed).slice(0, 12);
  const improvements = diffs.filter(improved).slice(0, 12);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3">
        <p className="text-[10px] font-semibold uppercase text-emerald-500">Largest agreement improvements</p>
        <ul className="mt-2 space-y-1 font-mono text-[10px] text-zinc-400">
          {improvements.length ? improvements.map((d) => <li key={d.itemId}>{d.entityId.slice(0, 12)}…</li>) : <li>—</li>}
        </ul>
      </div>
      <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-3">
        <p className="text-[10px] font-semibold uppercase text-red-400">Regressions</p>
        <ul className="mt-2 space-y-1 font-mono text-[10px] text-zinc-400">
          {regressions.length ? regressions.map((d) => <li key={d.itemId}>{d.entityId.slice(0, 12)}…</li>) : <li>—</li>}
        </ul>
      </div>
    </div>
  );
}
