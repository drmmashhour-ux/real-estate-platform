import type { CSSProperties } from "react";

type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  /** Preset tokens, or a hex color for custom themes (e.g. luxury dashboard). */
  accent?: "gold" | "neutral" | string;
  /** Use a left-to-right gradient fill (pairs well with hex accent). */
  gradient?: boolean;
  className?: string;
};

export function ProgressBar({
  value,
  max = 100,
  label,
  accent = "gold",
  gradient = false,
  className = "",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, max <= 0 ? 0 : (value / max) * 100));

  const isHex = typeof accent === "string" && accent.startsWith("#");
  let fillClass = "bg-gradient-to-r from-[#C9A646] to-amber-200";
  let fillStyle: CSSProperties | undefined;

  if (accent === "neutral") {
    fillClass = "bg-white/80";
  } else if (isHex) {
    fillClass = "";
    fillStyle = gradient
      ? {
          background: `linear-gradient(90deg, ${accent}, ${accent}cc, #fff8)`,
        }
      : { backgroundColor: accent };
  } else if (accent === "gold" && !gradient) {
    fillClass = "bg-gradient-to-r from-[#C9A646] to-amber-200";
  }

  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-[#A1A1A1]">
          <span>{label}</span>
          <span className="tabular-nums text-white">{Math.round(pct)}%</span>
        </div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full transition-[width] duration-300 ease-out ${fillClass}`.trim()}
          style={{ width: `${pct}%`, ...fillStyle }}
        />
      </div>
    </div>
  );
}
