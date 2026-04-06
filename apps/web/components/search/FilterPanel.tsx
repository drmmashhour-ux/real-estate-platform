"use client";

import { useEffect, useRef, type ReactNode } from "react";

export { FilterCategory, FilterCategory as FilterAccordionSection } from "./FilterCategory";

type FilterPanelSize = "md" | "lg" | "xl" | "2xl";

const sizeClass: Record<FilterPanelSize, string> = {
  md: "sm:w-[min(100%,360px)]",
  lg: "sm:w-[min(100%,440px)]",
  xl: "sm:w-[min(100%,560px)]",
  /** Centris-style wide advanced filters */
  "2xl": "sm:w-[min(100%,720px)]",
};

type FilterPanelProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: FilterPanelSize;
  className?: string;
  /** Light surface (MLS-style white panel) vs dark premium panel. */
  tone?: "dark" | "light";
  /** For `aria-controls` on the open trigger. */
  id?: string;
};

/**
 * Filters: on small screens, full-viewport sheet; on `sm+`, dropdown under the search bar.
 * Backdrop + Escape close. Body scroll locked while open.
 */
export function FilterPanel({
  open,
  onClose,
  children,
  footer,
  size = "lg",
  className = "",
  tone = "dark",
  id = "search-filters-panel",
}: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      el.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const light = tone === "light";
  const surface = light
    ? "border-slate-200/95 bg-white text-slate-900 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.22)]"
    : "border-white/10 bg-[#121212] text-white shadow-[0_24px_80px_-12px_rgba(0,0,0,0.75)]";

  return (
    <>
      <button
        type="button"
        aria-label="Close filters"
        className="fixed inset-0 z-40 cursor-default bg-black/55 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id={id}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={[
          "flex flex-col overflow-hidden border transition duration-200 ease-out",
          /* Mobile: full-page sheet */
          "fixed inset-0 z-50 h-[100dvh] max-h-[100dvh] w-full rounded-none",
          /* Desktop: anchored card under trigger */
          "sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:z-50 sm:mt-2 sm:h-auto sm:max-h-[min(82vh,760px)] sm:rounded-2xl sm:shadow-xl",
          surface,
          sizeClass[size],
          className,
        ].join(" ")}
      >
        <div
          className={[
            "flex shrink-0 items-center justify-between border-b px-4 py-3 sm:hidden",
            light ? "border-slate-200 bg-white" : "border-white/10 bg-[#121212]",
          ].join(" ")}
        >
          <h2 className="text-base font-semibold text-inherit">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-semibold",
              light ? "text-slate-600 hover:bg-slate-100" : "text-slate-300 hover:bg-white/10",
            ].join(" ")}
          >
            Close
          </button>
        </div>

        <div
          className={[
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5",
            light ? "bg-white" : "",
          ].join(" ")}
        >
          {children}
        </div>

        {footer ? (
          <div
            className={[
              "shrink-0 border-t px-4 py-3 sm:px-5",
              light ? "border-slate-200 bg-slate-50/95" : "border-white/10 bg-[#0f0f0f]/95",
            ].join(" ")}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </>
  );
}
