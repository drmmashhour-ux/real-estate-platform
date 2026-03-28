"use client";

import { useId } from "react";

type ScoreCircleProps = {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const dim: Record<NonNullable<ScoreCircleProps["size"]>, { px: number; stroke: number }> = {
  sm: { px: 72, stroke: 5 },
  md: { px: 104, stroke: 6 },
  lg: { px: 140, stroke: 7 },
};

export function ScoreCircle({ value, max = 100, size = "md", className = "" }: ScoreCircleProps) {
  const gid = useId().replace(/:/g, "");
  const gradId = `lecipmScoreGrad-${gid}`;
  const { px, stroke } = dim[size];
  const r = (px - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, max <= 0 ? 0 : value / max));
  const offset = c * (1 - pct);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`.trim()} style={{ width: px, height: px }}>
      <svg width={px} height={px} className="-rotate-90" aria-hidden>
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-premium-gold)" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-bold tabular-nums text-white leading-none" style={{ fontSize: size === "lg" ? 36 : size === "md" ? 28 : 22 }}>
          {Math.round(value)}
        </span>
        <span className="text-[10px] font-medium text-[#A1A1A1]">/ {max}</span>
      </div>
    </div>
  );
}
