"use client";

import type { ReactNode } from "react";

type Props = {
  /** Shown on hover/focus and as accessible description */
  label: string;
  children: ReactNode;
  className?: string;
  /** Larger tap target for the (i) icon */
  side?: "inline" | "block";
};

/**
 * Small info control with accessible tooltip (hover + focus + title fallback).
 */
export function HintTooltip({ label, children, className = "", side = "inline" }: Props) {
  const wrap =
    side === "block" ? "flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2" : "inline-flex items-center gap-1.5";

  return (
    <span className={`group relative ${wrap} ${className}`}>
      {children}
      <button
        type="button"
        title={label}
        aria-label={label}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-premium-gold/40 bg-premium-gold/10 text-[10px] font-bold text-premium-gold outline-none transition hover:bg-premium-gold/20 focus-visible:ring-2 focus-visible:ring-premium-gold/50"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-xl border border-premium-gold/30 bg-[#1a1a1a] px-3 py-2 text-left text-xs leading-snug text-[#E5E5E5] shadow-xl group-hover:block group-focus-within:block sm:group-focus-within:block"
      >
        {label}
      </span>
    </span>
  );
}
