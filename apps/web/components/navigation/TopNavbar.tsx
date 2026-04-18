"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type Props = {
  /** Logo / back control (left) */
  left: ReactNode;
  /** Optional center nav (hidden on narrow when using MobileNav) */
  center?: ReactNode;
  /** CTAs / account (right) */
  right?: ReactNode;
  /** Solid background after scroll */
  scrollSolidThreshold?: number;
  className?: string;
};

/**
 * Sticky top bar — shared chrome for hubs and tools. Pass locale-aware `Link`s from the parent.
 */
export function TopNavbar({ left, center, right, scrollSolidThreshold = 16, className = "" }: Props) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > scrollSolidThreshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollSolidThreshold]);

  return (
    <header
      className={[
        "sticky top-0 z-[90] border-b transition-colors duration-300",
        solid ? "border-ds-border bg-ds-bg/95 shadow-ds-soft backdrop-blur-md" : "border-transparent bg-ds-bg/50 backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-3">{left}</div>
        {center ? (
          <div className="hidden min-w-0 flex-1 justify-center lg:flex" aria-label="Primary navigation">
            {center}
          </div>
        ) : null}
        <div className="flex shrink-0 items-center justify-end gap-2">{right}</div>
      </div>
    </header>
  );
}
