"use client";

import Link from "next/link";

import type { Territory, TerritoryDomination } from "../market-domination.types";

type Props = {
  territory: Territory;
  domination: TerritoryDomination;
  territoryHref: string;
};

export function TerritoryScoreCard({ territory, domination, territoryHref }: Props) {
  const trendArrow =
    domination.trend === "up" ? "↑" : domination.trend === "down" ? "↓" : "→";
  const trendCls =
    domination.trend === "up"
      ? "text-emerald-400"
      : domination.trend === "down"
        ? "text-rose-400"
        : "text-zinc-400";

  return (
    <Link
      href={territoryHref}
      className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-amber-500/40 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">{territory.scope}</p>
          <p className="text-lg font-semibold text-white">{territory.name}</p>
          <p className="text-xs text-zinc-500">{territory.regionLabel}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${trendCls}`}>{trendArrow}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Domination</p>
          <p className="text-2xl font-semibold text-amber-100">{domination.score}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Strength</p>
          <p className="line-clamp-2 text-xs text-zinc-300">{domination.biggestStrength}</p>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] text-rose-200/90">Weak: {domination.biggestWeakness}</p>
    </Link>
  );
}
