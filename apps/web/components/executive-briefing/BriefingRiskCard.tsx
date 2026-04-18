"use client";

export function BriefingRiskCard({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-100/90">
      <div className="text-xs font-medium uppercase text-red-200/70">Risques / alertes</div>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}
