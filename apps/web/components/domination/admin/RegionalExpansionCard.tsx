export function RegionalExpansionCard(props: { regions: string[]; notes: string[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-xs uppercase text-slate-500">Regional expansion targets</p>
      {props.regions.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No regions configured.</p>
      ) : (
        <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
          {props.regions.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      <ul className="mt-2 text-xs text-slate-600">
        {props.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
