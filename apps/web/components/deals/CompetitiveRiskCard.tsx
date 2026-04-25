"use client";

type L = "low" | "medium" | "high";

const R: Record<L, string> = {
  low: "border-slate-600/50 bg-slate-800/40 text-slate-200",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  high: "border-rose-500/40 bg-rose-500/10 text-rose-100",
};

export function CompetitiveRiskCard({ level, rationale }: { level: L; rationale: string[] }) {
  return (
    <div className={`rounded-lg border p-2 text-sm ${R[level]}`}>
      <p className="font-medium">Competition-style risk: {level}</p>
      <p className="mt-1 text-xs opacity-90">Estimate from conversation hints only — not proof of other offers or parties.</p>
      <ul className="mt-2 list-inside list-disc text-xs">
        {rationale.slice(0, 3).map((r) => (
          <li key={r.slice(0, 40)}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
