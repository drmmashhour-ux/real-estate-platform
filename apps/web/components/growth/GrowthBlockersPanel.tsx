"use client";

export function GrowthBlockersPanel({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">Biggest blockers (heuristic)</h3>
      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-400">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
