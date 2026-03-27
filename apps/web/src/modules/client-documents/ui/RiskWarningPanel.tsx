type Props = { contradictions: string[]; warnings: string[] };

export function RiskWarningPanel({ contradictions, warnings }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Risk & warnings</p>
      <div className="mt-2 space-y-1 text-xs">
        {contradictions.length ? contradictions.map((c) => <p key={c} className="rounded-md bg-rose-500/10 px-2 py-1 text-rose-200">{c}</p>) : <p className="text-emerald-200">No contradiction flags.</p>}
        {warnings.length ? warnings.map((w) => <p key={w} className="rounded-md bg-amber-500/10 px-2 py-1 text-amber-100">{w}</p>) : <p className="text-emerald-200">No warning flags.</p>}
      </div>
    </div>
  );
}
