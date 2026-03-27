import type { Bottleneck } from "@/modules/analytics/types";

type Props = { bottlenecks: Bottleneck[] };

const sev: Record<string, string> = {
  HIGH: "border-rose-500/50 bg-rose-500/10 text-rose-100",
  MEDIUM: "border-amber-500/50 bg-amber-500/10 text-amber-100",
  LOW: "border-white/10 bg-white/5 text-[#B3B3B3]",
};

export function AdminBottlenecksPanel({ bottlenecks }: Props) {
  if (bottlenecks.length === 0) {
    return <p className="text-sm text-[#737373]">No bottlenecks detected.</p>;
  }

  return (
    <ul className="space-y-2">
      {bottlenecks.map((b) => (
        <li
          key={b.type}
          className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${sev[b.severity] ?? sev.LOW}`}
        >
          <div>
            <p className="font-medium">{b.label}</p>
            <p className="text-xs opacity-80">
              Avg delay:{" "}
              {b.avgDelayHours != null ? `${b.avgDelayHours.toFixed(1)} h` : "—"} · Severity {b.severity}
            </p>
          </div>
          <span className="text-xl font-semibold tabular-nums">{b.count}</span>
        </li>
      ))}
    </ul>
  );
}
