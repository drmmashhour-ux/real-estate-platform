"use client";

/** Factual urgency only — e.g. calendar data from parent; no fake “17 people viewing”. */
export function UrgencySignals({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
    </div>
  );
}
