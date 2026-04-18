export function EscalationPanel({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-900/40 bg-black/30 p-4 text-sm text-ds-text-secondary">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-200/80">Escalations</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}
