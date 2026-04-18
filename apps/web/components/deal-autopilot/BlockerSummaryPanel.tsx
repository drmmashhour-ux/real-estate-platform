import type { AutopilotBlocker } from "@/modules/deal-autopilot/deal-autopilot.types";

export function BlockerSummaryPanel({ blockers }: { blockers: AutopilotBlocker[] }) {
  if (blockers.length === 0) {
    return <p className="text-sm text-ds-text-secondary">No blockers detected from tracked data.</p>;
  }
  return (
    <ul className="space-y-2">
      {blockers.map((b) => (
        <li key={b.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
          <span className="text-[10px] font-semibold uppercase text-ds-gold/80">{b.category}</span> {b.title}
          <p className="text-xs text-ds-text-secondary">{b.detail}</p>
        </li>
      ))}
    </ul>
  );
}
