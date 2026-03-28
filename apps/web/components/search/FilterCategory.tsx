"use client";

import type { ReactNode } from "react";

type FilterCategoryProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  /** `centris` = flat list row + / − (public MLS-style panel). */
  variant?: "dark" | "slate" | "centris";
};

/** Collapsible filter section (accordion) — use inside `FilterPanel`. */
export function FilterCategory({ title, defaultOpen = false, children, variant = "dark" }: FilterCategoryProps) {
  if (variant === "centris") {
    return (
      <details
        open={defaultOpen}
        className="group border-b border-slate-200/90 last:border-b-0 dark:border-white/10"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-1 py-3.5 text-sm font-semibold text-premium-gold [&::-webkit-details-marker]:hidden">
          <span>{title}</span>
          <span className="text-lg font-light leading-none text-premium-gold/90 group-open:hidden" aria-hidden>
            +
          </span>
          <span className="hidden text-lg font-light leading-none text-premium-gold/90 group-open:inline" aria-hidden>
            −
          </span>
        </summary>
        <div className="border-t border-slate-100 px-1 pb-4 pt-3 text-slate-800 dark:border-white/10 dark:text-slate-200">
          {children}
        </div>
      </details>
    );
  }

  const border = variant === "slate" ? "border-slate-700/80" : "border-white/10";
  const summaryText = variant === "slate" ? "text-slate-100" : "text-white";
  const chevron = "text-slate-500";

  return (
    <details
      open={defaultOpen}
      className={`group rounded-xl border ${border} bg-white/[0.02] open:bg-white/[0.04]`}
    >
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold ${summaryText} [&::-webkit-details-marker]:hidden`}
      >
        {title}
        <span className={`text-xs transition group-open:rotate-180 ${chevron}`}>▾</span>
      </summary>
      <div className="border-t border-white/5 px-3 pb-3 pt-2">{children}</div>
    </details>
  );
}
