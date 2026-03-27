import type { SlaStateKind } from "@/lib/trustgraph/domain/sla";

const styles: Record<SlaStateKind, string> = {
  on_track: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  due_soon: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  overdue: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
  escalated: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
};

export function SlaStatusBadge({ state }: { state: SlaStateKind }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${styles[state]}`}>{state}</span>;
}
