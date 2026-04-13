"use client";

import type { FreshSetDistribution } from "@/modules/model-validation/infrastructure/validationSamplingService";

export function FreshSetSamplingSummary({
  counts,
  shortfalls,
  listingCount,
}: {
  counts: FreshSetDistribution;
  shortfalls: string[];
  listingCount: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-400">
      <p className="font-semibold uppercase tracking-wide text-zinc-500">Fresh set sampling</p>
      <p className="mt-2">
        Target: {counts.strong} strong / {counts.average} average / {counts.weakIncomplete} weak-incomplete /{" "}
        {counts.suspicious} suspicious — picked {listingCount} listings.
      </p>
      {shortfalls.length ? (
        <ul className="mt-2 list-inside list-disc text-amber-300/90">
          {shortfalls.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-emerald-400/90">All buckets met target counts.</p>
      )}
    </div>
  );
}
