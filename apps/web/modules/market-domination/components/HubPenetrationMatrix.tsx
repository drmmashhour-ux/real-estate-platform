"use client";

import type { HubPenetrationResult, HubType, PenetrationBand } from "../market-domination.types";

type Row = { territoryId: string; territoryName: string; penetration: HubPenetrationResult[] };

const HUB_ORDER: HubType[] = ["BUYER", "SELLER", "BROKER", "BNHUB", "INVESTOR", "RESIDENCE"];

function bandStyle(b: PenetrationBand): string {
  switch (b) {
    case "LOW":
      return "bg-zinc-800 text-zinc-300 border-zinc-600";
    case "MEDIUM":
      return "bg-amber-950/80 text-amber-200 border-amber-700/60";
    case "HIGH":
      return "bg-emerald-950/80 text-emerald-200 border-emerald-700/60";
    case "DOMINANT":
      return "bg-violet-950/90 text-violet-100 border-violet-600/70";
    default:
      return "bg-zinc-800 text-zinc-400";
  }
}

type Props = { rows: Row[] };

export function HubPenetrationMatrix({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/40">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-zinc-500">
            <th className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-2 font-medium">Territory</th>
            {HUB_ORDER.map((h) => (
              <th key={h} className="px-2 py-2 font-medium text-zinc-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.territoryId} className="border-b border-white/5">
              <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-2 font-medium text-white">
                {r.territoryName}
              </td>
              {HUB_ORDER.map((hub) => {
                const cell = r.penetration.find((p) => p.hub === hub);
                const band = cell?.band ?? "LOW";
                return (
                  <td key={hub} className="px-1 py-1">
                    <div
                      className={`rounded-lg border px-1.5 py-1 text-center text-[10px] font-semibold ${bandStyle(band)}`}
                      title={cell?.supportingMetrics.join(" · ") ?? ""}
                    >
                      {band}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-white/10 px-3 py-2 text-[11px] text-zinc-500">
        Bands are heuristic proxies from listings, demand, bookings, and bench metrics — not census-accurate market share.
      </p>
    </div>
  );
}
