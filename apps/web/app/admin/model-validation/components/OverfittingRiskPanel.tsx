"use client";

import type { OverfittingRiskLevel } from "@/modules/model-validation/infrastructure/overfittingCheckService";

function badge(risk: OverfittingRiskLevel): string {
  if (risk === "high") return "bg-red-950/60 text-red-200 border-red-800";
  if (risk === "medium") return "bg-amber-950/50 text-amber-200 border-amber-800";
  return "bg-emerald-950/40 text-emerald-200 border-emerald-800";
}

export function OverfittingRiskPanel({
  risk,
  reasons,
}: {
  risk: OverfittingRiskLevel;
  reasons: string[];
}) {
  return (
    <div className={`rounded-xl border p-4 ${badge(risk)}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Overfitting risk</p>
      <p className="mt-1 text-lg font-bold capitalize">{risk}</p>
      <ul className="mt-3 list-inside list-disc space-y-1 text-sm leading-relaxed opacity-95">
        {reasons.map((r, i) => (
          <li key={`${i}-${r}`}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
