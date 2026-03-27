type Level = "low" | "medium" | "high";

const levelStyles: Record<Level, string> = {
  high: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  low: "border-slate-600 bg-slate-900/80 text-slate-200",
};

export function ConfidenceScoreCard(props: {
  level: Level;
  score: number;
  reasons: string[];
  guestHint?: string | null;
}) {
  const { level, score, reasons, guestHint } = props;
  return (
    <div className={`rounded-xl border p-4 ${levelStyles[level]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Booking confidence</p>
      <p className="mt-1 text-lg font-semibold capitalize">{level}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{score}</p>
      <p className="mt-1 text-xs text-slate-400">Score out of 100 (trust-first model)</p>
      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-300">
        {reasons.slice(0, 6).map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {guestHint ? <p className="mt-3 text-xs text-slate-400">{guestHint}</p> : null}
    </div>
  );
}
