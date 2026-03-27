"use client";

type ConfidenceBadgeProps = {
  label: "low" | "medium" | "high";
  score: number;
  size?: "sm" | "md";
};

export function ConfidenceBadge({ label, score, size = "md" }: ConfidenceBadgeProps) {
  const styles =
    label === "high"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : label === "medium"
        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
        : "bg-slate-500/20 text-slate-400 border-slate-500/30";

  return (
    <span
      className={`inline-flex items-center rounded border px-2 font-medium ${styles} ${
        size === "sm" ? "text-xs py-0.5" : "text-sm py-1"
      }`}
      title={`Confidence: ${score}%`}
    >
      {label} confidence
    </span>
  );
}
