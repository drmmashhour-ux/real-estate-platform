import type { PendingActionsSummary } from "@/modules/analytics/types";

type Props = { summary: PendingActionsSummary };

const urgencyStyle: Record<string, string> = {
  high: "border-rose-500/40 bg-rose-500/10 text-rose-100",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  low: "border-white/10 bg-white/5 text-[#B3B3B3]",
};

export function AdminPendingActions({ summary }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {summary.groups.map((g) => (
        <div
          key={g.key}
          className={`flex items-center justify-between rounded-lg border px-3 py-2 ${urgencyStyle[g.urgency] ?? urgencyStyle.low}`}
        >
          <span className="text-sm">{g.label}</span>
          <span className="text-lg font-semibold tabular-nums">{g.count}</span>
        </div>
      ))}
      <div className="sm:col-span-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center text-sm text-[#737373]">
        Total tracked items: <span className="font-medium text-white">{summary.total}</span>
      </div>
    </div>
  );
}
