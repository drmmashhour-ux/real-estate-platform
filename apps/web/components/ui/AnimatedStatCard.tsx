"use client";

import { useEffect, useState } from "react";

type AnimatedStatCardProps = {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
  duration?: number;
  className?: string;
};

function isNumeric(v: number | string): v is number {
  return typeof v === "number" && !Number.isNaN(v);
}

export function AnimatedStatCard({
  label,
  value,
  sub,
  accent = "#C9A96E",
  duration = 1200,
  className = "",
}: AnimatedStatCardProps) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!isNumeric(value)) return;
    const start = 0;
    const end = value;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeOut = 1 - (1 - progress) ** 2;
      setDisplay(Math.round(start + (end - start) * easeOut));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [value, duration]);

  const displayValue = isNumeric(value) ? display : value;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 ease-out hover:scale-[1.02] ${className}`}
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        borderColor: `${accent}30`,
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80" style={{ color: accent }}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{displayValue}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}
