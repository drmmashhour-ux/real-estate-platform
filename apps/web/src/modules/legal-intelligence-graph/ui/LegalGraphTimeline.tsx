export function LegalGraphTimeline({ actions }: { actions: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Next actions</p>
      <ul className="mt-2 space-y-1 text-xs text-slate-300">{actions.length ? actions.map((a) => <li key={a}>{a}</li>) : <li className="text-slate-500">No actions.</li>}</ul>
    </div>
  );
}
