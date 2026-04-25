"use client";

type B = { key: string; label: string; severity: "low" | "medium" | "high"; rationale: string[] };

const SEV: Record<B["severity"], string> = {
  high: "border-rose-500/40 bg-rose-500/10 text-rose-100",
  medium: "border-amber-500/35 bg-amber-500/10 text-amber-100",
  low: "border-slate-600/60 bg-slate-800/50 text-slate-300",
};

export function CloseBlockersPanel({ blockers }: { blockers: B[] }) {
  if (blockers.length === 0) {
    return <p className="text-xs text-slate-500">No blockers listed in this pass.</p>;
  }
  return (
    <ul className="space-y-2">
      {blockers.map((b) => (
        <li key={b.key} className={`rounded-lg border px-2 py-1.5 text-xs ${SEV[b.severity]}`}>
          <span className="font-medium">{b.label}</span>
          <ul className="mt-1 list-inside list-disc text-[11px] opacity-90">
            {b.rationale.slice(0, 3).map((r) => (
              <li key={r.slice(0, 24)}>{r}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
