"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BnHubHeaderMark } from "@/components/bnhub/BnHubHeaderMark";
import { BnHubLogoMark } from "@/components/bnhub/BnHubLogoMark";
import { BNHUB_LOGO_SRC } from "@/lib/brand/bnhub-logo";

const NAV = [
  { href: "/host", label: "Dashboard" },
  { href: "/host/bookings", label: "Bookings" },
  { href: "/host/listings", label: "Listings" },
  { href: "/host/pricing", label: "Pricing" },
  { href: "/host/autopilot", label: "Autopilot" },
  { href: "/host/calendar", label: "Calendar" },
  { href: "/host/payouts", label: "Payouts" },
  { href: "/host/bnhub/payments/onboarding", label: "Settings" },
] as const;

const GOLD = "#D4AF37";

function NavLinkDesktop({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/host" && pathname.startsWith(href + "/"));
  return (
    <Link
      href={href}
      className="block rounded-xl px-3 py-2 text-sm font-medium transition"
      style={{
        color: active ? GOLD : "rgb(161 161 170)",
        backgroundColor: active ? "rgba(212, 175, 55, 0.12)" : "transparent",
      }}
    >
      {label}
    </Link>
  );
}

function NavLinkMobile({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/host" && pathname.startsWith(href + "/"));
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={[
        "lecipm-touch flex min-h-[52px] w-full shrink-0 items-center justify-center px-5 py-3.5 text-base font-semibold leading-snug active:opacity-90",
        active ? "lecipm-prestige-pill lecipm-neon-gold" : "lecipm-prestige-pill lecipm-neon-white-muted",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export function HostShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080808] text-neutral-100">
      <header className="sticky top-0 z-40 border-b border-premium-gold/20 bg-black/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              className="lecipm-touch flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-premium-gold/30 text-premium-gold/80 md:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <BnHubHeaderMark showLogo={false} />
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLinkDesktop key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>
        </div>
        <div className="border-t border-white/10 bg-black/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2.5 sm:px-6">
            <Link
              href="/bnhub"
              className="flex shrink-0 items-center gap-2 rounded-full border border-premium-gold/35 bg-premium-gold/10 px-3.5 py-2 text-sm font-semibold text-premium-gold transition hover:border-premium-gold/55 hover:bg-premium-gold/15"
            >
              <BnHubLogoMark
                decorative
                src={BNHUB_LOGO_SRC}
                size="xs"
                className="!h-[20px] max-h-[20px] w-auto max-w-[104px] object-contain object-left sm:!h-6 sm:max-h-6 sm:max-w-[120px]"
              />
              BNHUB
            </Link>
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-premium-gold/55">Host</span>
          </div>
        </div>
        {open ? (
          <div className="border-t border-white/10 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:hidden">
            <nav className="lecipm-mobile-nav-scroll flex w-full flex-col gap-3" aria-label="Host navigation">
              {NAV.map((item) => (
                <NavLinkMobile
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </nav>
          </div>
        ) : null}
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
