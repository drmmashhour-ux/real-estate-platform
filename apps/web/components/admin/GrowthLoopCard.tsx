export function GrowthLoopCard(props: { counts: Record<string, number> }) {
  const entries = Object.entries(props.counts);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Growth loop signals</h3>
      <ul className="mt-4 space-y-2 text-sm text-stone-200">
        {entries.length === 0 ? <li className="text-stone-500">No data</li> : null}
        {entries.map(([k, v]) => (
          <li key={k} className="flex justify-between gap-4">
            <span className="font-mono text-xs text-stone-400">{k}</span>
            <span>{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
