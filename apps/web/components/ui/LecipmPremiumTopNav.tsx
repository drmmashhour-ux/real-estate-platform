import Link from "next/link";
import type { ReactNode } from "react";

export type LecipmNavLink = { href: string; label: string };

export function LecipmPremiumTopNav({
  links,
  logo = "LECIPM",
  rightSlot,
  className = "",
}: {
  links: LecipmNavLink[];
  /** Wordmark text — keep short; use gold for brand */
  logo?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
}) {
  return (
    <header className={["lp-nav-bar sticky top-0 z-50 w-full", className].filter(Boolean).join(" ")}>
      <div className="lp-section-bleed flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-4 py-3 sm:min-h-16">
        <Link href="/" className="lecipm-wordmark text-base font-semibold sm:text-lg">
          {logo}
        </Link>
        <nav aria-label="Main" className="flex flex-1 flex-wrap items-center justify-end gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-ds-text-secondary transition hover:text-ds-gold sm:px-4 lp-tap"
            >
              {l.label}
            </Link>
          ))}
          {rightSlot}
        </nav>
      </div>
    </header>
  );
}
