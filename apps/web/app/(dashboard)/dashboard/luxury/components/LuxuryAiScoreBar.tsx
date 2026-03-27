"use client";

import { useEffect, useState } from "react";

const GOLD = "#C9A96E";

type LuxuryAiScoreBarProps = {
  score?: number;
  label?: string;
  className?: string;
};

export function LuxuryAiScoreBar({
  score = 0,
  label = "AI Score",
  className = "",
}: LuxuryAiScoreBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const target = Math.min(100, Math.max(0, score));
    const id = requestAnimationFrame(() => {
      setWidth(target);
    });
    return () => cancelAnimationFrame(id);
  }, [score]);

  return (
    <div className={className}>
      <div className="flex justify-between text-xs font-medium text-slate-400">
        <span>{label}</span>
        <span style={{ color: GOLD }}>{width}%</span>
      </div>
      <div
        className="mt-2 h-3 overflow-hidden rounded-full"
        style={{
          background: "rgba(255,255,255,0.08)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, #8B7355 0%, ${GOLD} 50%, #E5C76B 100%)`,
            boxShadow: `0 0 12px ${GOLD}40`,
          }}
        />
      </div>
    </div>
  );
}
