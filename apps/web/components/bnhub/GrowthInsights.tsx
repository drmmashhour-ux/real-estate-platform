import type { GrowthInsight } from "@/lib/bnhub/host-growth-engine";

function severityStyles(severity: GrowthInsight["severity"]) {
  switch (severity) {
    case "watch":
      return "border-amber-500/35 bg-amber-500/[0.06]";
    case "opportunity":
      return "border-emerald-500/35 bg-emerald-500/[0.06]";
    default:
      return "border-white/10 bg-white/[0.03]";
  }
}

export function GrowthInsights({
  insights,
  className = "",
}: {
  insights: GrowthInsight[];
  className?: string;
}) {
  if (!insights.length) return null;

  return (
    <ul className={`space-y-3 ${className}`}>
      {insights.map((insight) => (
        <li
          key={insight.id}
          className={`rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 ${severityStyles(insight.severity)}`}
        >
          <p className="text-sm font-semibold text-white">{insight.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/70">{insight.body}</p>
        </li>
      ))}
    </ul>
  );
}
