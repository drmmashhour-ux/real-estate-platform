"use client";

import type { LaunchModeView as LaunchData } from "../../company-command-center-v5.types";
import { ReadinessChecklist } from "../shared/ReadinessChecklist";

const LR: Record<LaunchData["launchReadiness"], string> = {
  go: "text-emerald-300",
  caution: "text-amber-300",
  hold: "text-rose-300",
};

export function LaunchModeView({ view }: { view: LaunchData }) {
  return (
    <div className="space-y-6">
      <p className={`text-sm font-medium ${LR[view.launchReadiness]}`}>
        Launch readiness: <span className="uppercase">{view.launchReadiness}</span>
      </p>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Blockers</h4>
        <ul className="mt-2 space-y-1 text-xs text-zinc-300">
          {(view.blockers.length ? view.blockers : ["—"]).map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Readiness checklist</h4>
        <div className="mt-2">
          <ReadinessChecklist checklist={view.readinessChecklist} />
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Rollout states</h4>
        <ul className="mt-2 space-y-2 text-xs text-zinc-400">
          {view.rolloutStates.map((r, i) => (
            <li key={i} className="rounded border border-zinc-800/60 px-2 py-1">
              <span className="text-zinc-200">{r.label}</span>: {r.detail}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Go / no-go notes</h4>
        <ul className="mt-2 space-y-1 text-xs text-zinc-300">
          {(view.recommendedGoNoGoNotes.length ? view.recommendedGoNoGoNotes : ["—"]).map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
      {view.warnings.length > 0 ? (
        <div>
          <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Warnings</h4>
          <ul className="mt-2 text-xs text-zinc-500">
            {view.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
