import type { DealHealthLevel } from "@/modules/deal-autopilot/deal-autopilot.types";

const STYLES: Record<DealHealthLevel, string> = {
  healthy: "border-emerald-500/40 bg-emerald-950/30 text-emerald-100",
  attention: "border-amber-500/40 bg-amber-950/30 text-amber-100",
  at_risk: "border-orange-500/40 bg-orange-950/30 text-orange-100",
  blocked: "border-red-500/40 bg-red-950/30 text-red-100",
};

export function DealHealthBadge({ level }: { level: DealHealthLevel }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${STYLES[level]}`}>{level.replace("_", " ")}</span>
  );
}
