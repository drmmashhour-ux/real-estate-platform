"use client";

import Link from "next/link";
import type { CommandCenterBoardPack } from "../../company-command-center-v6.types";
import { BoardMetricRow } from "../shared/BoardMetricRow";
import { BoardSummaryCard } from "../shared/BoardSummaryCard";

export function WeeklyBoardPackModeView({
  view,
  quickKpis,
}: {
  view: CommandCenterBoardPack;
  quickKpis: { label: string; value: string; href: string | null }[];
}) {
  const healthEntries = Object.entries(view.systemHealthSummary);
  return (
    <div className="space-y-6">
      <BoardSummaryCard title="Executive weekly summary" body={view.executiveSummary} />

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Weekly wins (delta signals)</h4>
          <ul className="mt-2 space-y-1 text-xs text-emerald-200/90">
            {view.weeklyWins.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Weekly risks (delta signals)</h4>
          <ul className="mt-2 space-y-1 text-xs text-amber-200/90">
            {view.weeklyRisks.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Rollout & posture</h4>
        <ul className="mt-2 space-y-1 text-xs text-zinc-300">
          {view.rolloutChanges.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Key metrics (snapshot KPIs)</h4>
        <div className="mt-2">
          <BoardMetricRow metrics={view.boardMetrics} />
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">System health counts</h4>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {healthEntries.length ? (
            healthEntries.map(([k, v]) => (
              <div key={k} className="rounded border border-zinc-800 px-2 py-1.5 text-[11px]">
                <span className="text-zinc-500">{k}</span>
                <p className="text-zinc-200">{String(v)}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-zinc-500">No health aggregates.</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Quick KPIs (shared)</h4>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {quickKpis.slice(0, 8).map((k) => (
            <div key={k.label} className="rounded-lg border border-zinc-800 px-2 py-1.5 text-[11px]">
              <span className="text-zinc-500">{k.label}</span>
              <p className="text-zinc-200">
                {k.href ? (
                  <Link href={k.href} className="text-amber-300/90 hover:text-amber-200">
                    {k.value}
                  </Link>
                ) : (
                  k.value
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Board notes & briefing lines</h4>
        <ul className="mt-2 space-y-1 text-xs text-zinc-400">
          {view.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
