"use client";

import type { UnitEconomicsSummary } from "@/modules/launch-simulation/launch-simulation.types";

export function UnitEconomicsCard({ unitEconomics: u }: { unitEconomics: UnitEconomicsSummary }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <p className="text-xs uppercase tracking-wider text-emerald-200/70">Unit economics (model)</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Modeled lodging GMV (3 mo)</dt>
          <dd className="text-right text-zinc-200">
            {u.modeledLodgingGmv3mCad.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Avg revenue / host (3 mo)</dt>
          <dd className="text-right text-zinc-200">
            {u.avgRevenuePerHost3mCad != null
              ? u.avgRevenuePerHost3mCad.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })
              : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Avg revenue / broker (3 mo)</dt>
          <dd className="text-right text-zinc-200">
            {u.avgRevenuePerBroker3mCad != null
              ? u.avgRevenuePerBroker3mCad.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })
              : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">CAC (placeholder)</dt>
          <dd className="text-right text-zinc-200">{u.cacCad != null ? `${u.cacCad.toFixed(0)} CAD` : u.cacNote}</dd>
        </div>
        <div className="border-t border-zinc-800 pt-2 text-xs text-zinc-500">{u.paybackNote}</div>
      </dl>
      {u.notes.length > 0 ? (
        <ul className="mt-3 list-disc pl-4 text-xs text-zinc-500">
          {u.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
