"use client";

import type { ThreeMonthProjection } from "@/modules/launch-simulation/launch-simulation.types";

export function RevenueProjectionCard({ projection }: { projection: ThreeMonthProjection }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <p className="text-xs uppercase tracking-wider text-amber-200/70">Projected platform revenue (estimate)</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-50">
        {projection.cumulativeRevenueCad.toLocaleString("en-CA", {
          style: "currency",
          currency: "CAD",
          maximumFractionDigits: 0,
        })}
      </p>
      <p className="mt-1 text-xs text-zinc-500">3-month cumulative · not actuals</p>
      <ul className="mt-4 space-y-2 text-sm text-zinc-400">
        {projection.months.map((m) => (
          <li key={m.month} className="flex justify-between border-b border-zinc-800/80 py-1">
            <span>Month {m.month}</span>
            <span className="text-zinc-200">
              {m.totalRevenue.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
