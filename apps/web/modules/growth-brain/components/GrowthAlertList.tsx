import type { GrowthBrainAlert } from "../growth-brain.types";

type Props = { alerts: GrowthBrainAlert[] };

export function GrowthAlertList({ alerts }: Props) {
  if (!alerts.length) {
    return <p className="text-sm text-zinc-600">No active alerts.</p>;
  }
  return (
    <ul className="space-y-2 text-sm">
      {alerts.map((a) => (
        <li key={a.id} className="rounded-lg border border-amber-500/20 bg-amber-950/15 px-3 py-2">
          <span className="text-[10px] uppercase text-amber-500">{a.kind.replace(/_/g, " ")}</span>
          <p className="font-medium text-amber-50">{a.title}</p>
          <p className="text-xs text-zinc-400">{a.body}</p>
        </li>
      ))}
    </ul>
  );
}
