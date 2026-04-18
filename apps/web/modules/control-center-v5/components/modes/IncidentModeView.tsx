"use client";

import type { IncidentModeView as IncidentData } from "../../company-command-center-v5.types";
import { ModeHeroSummary } from "../shared/ModeHeroSummary";
import { SeverityBanner } from "../shared/SeverityBanner";

export function IncidentModeView({ view }: { view: IncidentData }) {
  return (
    <div className="space-y-6">
      <SeverityBanner severity={view.severity} label="Incident posture" />
      <ModeHeroSummary text={view.incidentSummary} />
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-[10px] font-semibold uppercase text-rose-200/70">Critical / notable</h4>
          <ul className="mt-2 space-y-1 text-xs text-zinc-300">
            {(view.criticalWarnings.length ? view.criticalWarnings : ["—"]).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-semibold uppercase text-amber-200/70">Rollback signals</h4>
          <ul className="mt-2 space-y-1 text-xs text-zinc-300">
            {(view.rollbackSignals.length ? view.rollbackSignals : ["—"]).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Affected systems</h4>
        <p className="mt-2 text-xs text-zinc-400">{view.affectedSystems.join(", ") || "—"}</p>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Stability indicators (reported)</h4>
        <ul className="mt-2 space-y-1 text-[11px] text-zinc-500">
          {Object.entries(view.stabilityIndicators).map(([k, v]) => (
            <li key={k}>
              {k}: {v === null || v === undefined ? "—" : String(v)}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Immediate attention</h4>
        <ul className="mt-2 space-y-1 text-xs text-orange-200/80">
          {(view.recommendedAttentionAreas.length ? view.recommendedAttentionAreas : ["—"]).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
