/**
 * Admin-only: structured reviewer notes from QA reviews (never show to clients).
 */
export function SupervisorNotePanel(props: { notes: Array<{ reviewId: string; notes: Record<string, unknown> }> }) {
  if (props.notes.length === 0) return null;
  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-950/20 px-4 py-3 text-sm text-violet-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/90">Supervisor notes (internal)</p>
      <ul className="mt-2 space-y-2">
        {props.notes.map((n) => (
          <li key={n.reviewId} className="font-mono text-[11px] text-violet-200/80">
            <span className="text-violet-400/80">{n.reviewId.slice(0, 8)}…</span>
            <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-black/30 p-2 text-zinc-300">
              {JSON.stringify(n.notes, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
