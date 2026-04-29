"use client";

import { cn } from "@/lib/cn";

/** Grey + subtle blur until the real image fades in (SYBNB-76). */
export function ListingImageSkeleton({ active, className }: { active: boolean; className?: string }) {
  if (!active) return null;
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-[1] animate-pulse bg-[color:var(--darlink-surface-muted)] backdrop-blur-[2px] ring-1 ring-stone-200/30 listing-image-skeleton",
        className,
      )}
      aria-hidden
    />
  );
}
