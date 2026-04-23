import type { LearnedPattern } from "../growth-brain.types";

type Props = { pattern: LearnedPattern; tone: "strong" | "weak" };

export function GrowthPatternCard({ pattern, tone }: Props) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        tone === "strong"
          ? "border-emerald-500/30 bg-emerald-950/25 text-emerald-100"
          : "border-rose-500/25 bg-rose-950/20 text-rose-100"
      }`}
    >
      <p className="font-medium">{pattern.summary}</p>
      <p className="mt-1 text-[11px] opacity-80">{pattern.context}</p>
    </div>
  );
}
