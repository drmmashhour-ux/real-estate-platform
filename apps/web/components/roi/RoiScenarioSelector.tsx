"use client";

import { OPTIMIZATION_SCENARIOS } from "@/modules/roi/assumptions.constants";

export function RoiScenarioSelector({
  value,
  onChange,
}: {
  value: keyof typeof OPTIMIZATION_SCENARIOS;
  onChange: (k: keyof typeof OPTIMIZATION_SCENARIOS) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(OPTIMIZATION_SCENARIOS) as (keyof typeof OPTIMIZATION_SCENARIOS)[]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            value === k
              ? "bg-premium-gold text-black"
              : "border border-white/15 bg-white/[0.04] text-slate-300 hover:border-premium-gold/40"
          }`}
        >
          {OPTIMIZATION_SCENARIOS[k].label} ({(OPTIMIZATION_SCENARIOS[k].gainPercent * 100).toFixed(0)}%)
        </button>
      ))}
    </div>
  );
}
