"use client";

export function PositioningSummaryCard({ disclaimers }: { disclaimers: string[] }) {
  return (
    <div className="rounded-2xl border border-amber-900/30 bg-amber-950/20 p-5">
      <p className="text-xs uppercase tracking-wider text-amber-200/80">Disclosures</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-100/80">
        {disclaimers.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
    </div>
  );
}
