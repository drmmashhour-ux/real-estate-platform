"use client";

type Props = {
  readinessScore: number;
  allowed: boolean;
};

export function QuebecComplianceStatusBadge({ readinessScore, allowed }: Props) {
  const tone = allowed ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-rose-500/40 bg-rose-500/10 text-rose-200";
  return (
    <div className={`inline-flex flex-wrap items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      <span className="uppercase tracking-wide">QC readiness</span>
      <span>{readinessScore}/100</span>
      <span className="opacity-90">{allowed ? "Pass" : "Blocked"}</span>
    </div>
  );
}
