"use client";

/**
 * Mobile anchor to the in-page booking request when owner has no phone (SYBNB-11 fallback).
 */
export function SybnbRequestBookDock({ label }: { label: string }) {
  return (
    <div
      className="fixed inset-x-0 bottom-14 z-50 md:hidden border-t border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)]/98 px-3 py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <a
        href="#sybnb-request"
        className="flex h-12 w-full touch-manipulation items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-950 ring-1 ring-amber-200/80"
      >
        {label}
      </a>
    </div>
  );
}
