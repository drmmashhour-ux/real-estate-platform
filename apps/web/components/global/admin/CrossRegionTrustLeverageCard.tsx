export function CrossRegionTrustLeverageCard({
  rows,
  freshness,
}: {
  rows: Array<{ regionCode: string; leverageHint: boolean; notes: readonly string[] }>;
  freshness: string;
}) {
  const sorted = [...rows].sort((a, b) => a.regionCode.localeCompare(b.regionCode));
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4 text-sm text-zinc-200">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500">Trust leverage</p>
      <ul className="mt-3 space-y-2">
        {sorted.map((r) => (
          <li key={r.regionCode} className="flex justify-between border-b border-zinc-900 pb-2">
            <span>{r.regionCode}</span>
            <span className={r.leverageHint ? "text-emerald-400" : "text-zinc-500"}>
              {r.leverageHint ? "positive proxy" : "neutral"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-zinc-600">{freshness}</p>
    </div>
  );
}
