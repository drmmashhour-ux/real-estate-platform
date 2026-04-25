"use client";

type B = { key: string; label: string; severity: "low" | "medium" | "high"; rationale: string[] };
const SEV: Record<B["severity"], string> = {
  high: "border-rose-500/40 bg-rose-500/10",
  medium: "border-amber-500/35 bg-amber-500/10",
  low: "border-slate-600/50 bg-slate-800/40",
};

export function OfferBlockersPanel({ blockers }: { blockers: B[] }) {
  if (blockers.length === 0) return <p className="text-xs text-slate-500">No blockers listed.</p>;
  return (
    <ul className="space-y-2">
      {blockers.map((b) => (
        <li key={b.key} className={`rounded-lg border px-2 py-1.5 text-xs text-slate-200 ${SEV[b.severity]}`}>
          <span className="font-medium">{b.label}</span>
          <ul className="mt-1 list-inside list-disc text-[11px] text-slate-400">
            {b.rationale.slice(0, 2).map((r) => (
              <li key={r.slice(0, 30)}>{r}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
