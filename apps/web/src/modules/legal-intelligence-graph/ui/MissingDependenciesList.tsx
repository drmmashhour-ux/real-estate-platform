export function MissingDependenciesList({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Missing dependencies</p>
      <ul className="mt-2 space-y-1 text-xs text-amber-100">
        {items.length ? items.map((i) => <li key={i}>{i}</li>) : <li className="text-emerald-200">No missing dependencies.</li>}
      </ul>
    </div>
  );
}
