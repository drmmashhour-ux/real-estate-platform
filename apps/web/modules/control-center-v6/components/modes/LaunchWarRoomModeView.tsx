"use client";

import type { CommandCenterWarRoomSummary } from "../../company-command-center-v6.types";
import { WarRoomBanner } from "../shared/WarRoomBanner";
import { WarRoomBlockerList } from "../shared/WarRoomBlockerList";

export function LaunchWarRoomModeView({ view }: { view: CommandCenterWarRoomSummary }) {
  const checklist = Object.entries(view.readinessChecklist);
  return (
    <div className="space-y-6">
      <WarRoomBanner goNoGoSignals={view.goNoGoSignals} launchSummary={view.launchSummary} />

      <div className="grid gap-4 md:grid-cols-2">
        <WarRoomBlockerList title="Blockers & rollback signals" items={view.blockers} />
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-3">
          <h4 className="text-[10px] font-semibold uppercase text-amber-200/70">Critical systems (attention)</h4>
          <ul className="mt-2 space-y-1 text-xs text-zinc-300">
            {view.criticalSystems.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Go / caution / hold (heuristic)</h4>
        <ul className="mt-2 space-y-1 text-xs text-zinc-300">
          {view.goNoGoSignals.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Escalation items (digest severity)</h4>
        <ul className="mt-2 space-y-1 text-xs text-zinc-400">
          {view.escalationItems.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Readiness checklist</h4>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {checklist.map(([k, ok]) => (
            <li key={k} className="flex items-center justify-between rounded border border-zinc-800 px-2 py-1 text-[11px]">
              <span className="text-zinc-500">{k}</span>
              <span className={ok ? "text-emerald-400" : "text-rose-300"}>{ok ? "yes" : "no"}</span>
            </li>
          ))}
        </ul>
      </div>

      {view.warnings.length > 0 ? (
        <div>
          <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Warnings (founder + risk governance)</h4>
          <ul className="mt-2 space-y-1 text-xs text-zinc-400">
            {view.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
