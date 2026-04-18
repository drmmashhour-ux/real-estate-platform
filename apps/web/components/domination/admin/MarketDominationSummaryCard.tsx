export function MarketDominationSummaryCard(props: { notes: string[] }) {
  return (
    <div className="rounded-xl border border-violet-900/40 bg-slate-950/60 p-4">
      <p className="text-xs uppercase text-violet-300">Domination advisory</p>
      <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
        {props.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
