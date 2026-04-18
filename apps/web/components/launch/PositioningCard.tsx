type Row = { axis: string; lecipmCapability: string; competitorGap: string };

export function PositioningCard({ focus, rows }: { focus: string; rows: Row[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Positioning vs {focus}</h2>
      <p className="mt-1 text-xs text-zinc-500">Qualitative differentiation — no market-share numbers.</p>
      <ul className="mt-4 space-y-3 text-sm text-zinc-300">
        {rows.map((r) => (
          <li key={r.axis} className="border-b border-zinc-800/60 pb-3">
            <p className="font-medium text-amber-200/90">{r.axis}</p>
            <p className="mt-1 text-zinc-400">{r.lecipmCapability}</p>
            <p className="mt-1 text-xs text-zinc-600">{r.competitorGap}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
