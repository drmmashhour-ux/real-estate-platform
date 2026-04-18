export function ClosingReadinessPanel({
  score,
  label,
  checklist,
}: {
  score: number;
  label: string;
  checklist: { key: string; ok: boolean; note?: string }[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-3xl text-ds-gold">{score}</span>
        <span className="text-sm text-ds-text-secondary">/ 100 · {label}</span>
      </div>
      <ul className="space-y-1 text-sm text-ds-text-secondary">
        {checklist.map((c) => (
          <li key={c.key} className="flex gap-2">
            <span className={c.ok ? "text-emerald-400" : "text-amber-400"}>{c.ok ? "✓" : "•"}</span>
            <span>
              {c.key}
              {c.note ? <span className="text-ds-text-secondary/80"> — {c.note}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
