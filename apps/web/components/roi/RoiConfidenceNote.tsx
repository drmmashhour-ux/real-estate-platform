"use client";

export function RoiConfidenceNote({
  confidence,
  disclaimers,
}: {
  confidence: string;
  disclaimers: string[];
}) {
  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-950/30 p-4 text-sm text-amber-100/90">
      <p className="font-semibold text-amber-200">Confidence: {confidence}</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-amber-100/70">
        {disclaimers.map((d) => (
          <li key={d.slice(0, 40)}>{d}</li>
        ))}
      </ul>
    </div>
  );
}
