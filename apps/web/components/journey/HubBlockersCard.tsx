"use client";

export function HubBlockersCard({ blockers }: { blockers: string[] }) {
  if (!blockers.length) return null;
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs text-red-100">
      <p className="font-semibold text-red-200/90">Blockers</p>
      <ul className="mt-1 list-inside list-disc space-y-1 text-red-100/90">
        {blockers.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </div>
  );
}
