"use client";

import { OPTIMIZATION_SCENARIOS } from "@/modules/roi/assumptions.constants";

export function HostRevenueProofSection() {
  return (
    <section className="border-y border-white/10 bg-zinc-950/80 px-4 py-14 sm:px-6">
      <h2 className="text-center font-serif text-2xl text-white">Why hosts model higher net on LECIPM</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-500">
        Illustrative optimization bands — you choose the scenario in the calculator. Not verified performance.
      </p>
      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        {(Object.keys(OPTIMIZATION_SCENARIOS) as (keyof typeof OPTIMIZATION_SCENARIOS)[]).map((k) => (
          <div key={k} className="rounded-xl border border-white/10 p-5 text-center">
            <p className="text-lg font-semibold text-premium-gold">{OPTIMIZATION_SCENARIOS[k].label}</p>
            <p className="mt-2 text-3xl font-bold text-white">+{(OPTIMIZATION_SCENARIOS[k].gainPercent * 100).toFixed(0)}%</p>
            <p className="mt-2 text-xs text-slate-500">Modeled gross uplift before fees</p>
          </div>
        ))}
      </div>
    </section>
  );
}
