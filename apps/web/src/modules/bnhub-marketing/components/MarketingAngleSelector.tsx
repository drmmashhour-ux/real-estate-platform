import { m } from "./marketing-ui-classes";

/** Read-only display of AI-selected angle(s) for v1. */
export function MarketingAngleSelector({ angle }: { angle: string | null | undefined }) {
  if (!angle) return null;
  return (
    <div className={m.cardMuted}>
      <p className={m.label}>Market angle</p>
      <p className="text-sm font-medium text-amber-200">{angle}</p>
      <p className="mt-1 text-xs text-zinc-500">Heuristic + listing signals — swap LLM later without UI changes.</p>
    </div>
  );
}
