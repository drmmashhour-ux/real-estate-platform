export function MarketplaceRiskCard(props: { notes?: string[] }) {
  return (
    <div className="rounded-xl border border-amber-900/30 bg-slate-950/50 p-4">
      <p className="text-xs uppercase text-amber-200/80">Risk posture</p>
      <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
        {(props.notes ?? []).map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
