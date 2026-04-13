"use client";

import Link from "next/link";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";
import { PLATFORM_COPYRIGHT_LINE, platformBrandGoldTextClass } from "@/lib/brand/platform";

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/financial-hub", label: "Financial Hub" },
  { href: "/bnhub", label: "BNHUB" },
  { href: "/dashboard/real-estate", label: "Immobilier Hub" },
  { href: "/help", label: "Help" },
] as const;

type PlatformHubFooterProps = {
  /** `compact` = single row on wide screens; `full` = stacked with more padding */
  variant?: "compact" | "full";
  className?: string;
};

/**
 * Shared footer for hub shells (HubLayout, tools) — matches global marketing footer identity
 * (black / gold border, Inter body, LECIPM lockup) without duplicating the full marketing column layout.
 */
export function PlatformHubFooter({ variant = "compact", className = "" }: PlatformHubFooterProps) {
  const pad = variant === "full" ? "py-10 sm:py-12" : "py-6 sm:py-8";
  const linkCls = `text-sm ${platformBrandGoldTextClass} transition-colors hover:text-premium-gold-hover`;

  return (
    <footer
      className={`lecipm-footer-glow mt-auto shrink-0 border-t border-premium-gold/20 bg-[#0B0B0B] ${pad} ${className}`.trim()}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <LecipmBrandLockup
            href="/"
            variant="dark"
            density="compact"
            logoClassName="[&_img]:max-h-7 sm:[&_img]:max-h-8"
          />
          <nav aria-label="Hub footer" className="flex flex-wrap gap-x-4 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-center text-[11px] leading-relaxed text-[#737373] lg:max-w-sm lg:text-right">
          {PLATFORM_COPYRIGHT_LINE}
        </p>
      </div>
    </footer>
  );
}
