"use client";

export function ListingQualityCard(props: {
  qualityScore: number;
  completenessScore: number;
  mediaScore: number;
  conversionScore: number;
  issues: string[];
  recommendations: string[];
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-zinc-100">
      <h3 className="text-sm font-semibold">Listing quality</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-zinc-500">Blended</dt>
          <dd>{props.qualityScore}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Completeness</dt>
          <dd>{props.completenessScore}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Media</dt>
          <dd>{props.mediaScore}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Conversion</dt>
          <dd>{props.conversionScore}</dd>
        </div>
      </dl>
      {props.recommendations.length > 0 ? (
        <ul className="mt-3 list-inside list-disc text-xs text-zinc-400">
          {props.recommendations.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
