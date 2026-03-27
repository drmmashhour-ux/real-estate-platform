import type { WorkflowFunnel } from "@/modules/analytics/types";

type Props = { funnel: WorkflowFunnel };

export function AdminFunnelChart({ funnel }: Props) {
  const max = Math.max(1, ...funnel.stages.map((s) => s.count));

  return (
    <div className="space-y-3">
      {funnel.stages.map((s, i) => (
        <div key={s.name}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-[#B3B3B3]">
              {i + 1}. {s.name}
            </span>
            <span className="text-white">
              {s.count.toLocaleString()}
              {s.conversionRate != null ? (
                <span className="ml-2 text-xs text-[#737373]">({s.conversionRate}% vs prev)</span>
              ) : null}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600/80 to-amber-400/90"
              style={{ width: `${Math.max(4, (s.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
