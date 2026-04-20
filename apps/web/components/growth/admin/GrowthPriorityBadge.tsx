import type { GrowthPriorityLevel } from "@/modules/growth-intelligence/growth.types";

export function GrowthPriorityBadge({ level, score }: { level: GrowthPriorityLevel; score?: number }) {
  const tones: Record<GrowthPriorityLevel, string> = {
    urgent: "border-red-400/40 bg-red-950/40 text-red-100",
    high: "border-amber-400/35 bg-amber-950/35 text-amber-100",
    medium: "border-premium-gold/35 bg-black/40 text-premium-gold",
    low: "border-white/15 bg-black/25 text-zinc-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tones[level]}`}
    >
      {level}
      {score != null ? <span className="ml-1 font-mono opacity-70">{score}</span> : null}
    </span>
  );
}
