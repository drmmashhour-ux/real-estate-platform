"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";

const navLinks = [
  { href: "/buying", label: "Buy" },
  { href: "/bnhub/stays", label: "Rent" },
  { href: "/bnhub", label: "BNHUB" },
  { href: "/investors", label: "Invest" },
  { href: "/list-your-property", label: "List Property" },
] as const;

function navLinkClass(active: boolean) {
  return [
    "lecipm-prestige-pill lecipm-neon-white-muted min-h-0 whitespace-nowrap px-3.5 py-2 text-xs font-semibold transition sm:text-sm",
    active
      ? "!border-premium-gold/60 bg-premium-gold/10 text-premium-gold shadow-[0_0_22px_rgb(var(--premium-gold-channels)/0.18)]"
      : "",
  ].join(" ");
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const p = pathname.replace(/\/$/, "") || "/";

  return (
    <header className="sticky top-0 z-50 border-b border-[#D4AF37]/20 bg-black/95 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <LecipmBrandLockup href="/" variant="dark" density="compact" priority className="max-w-[min(100%,11rem)] sm:max-w-none" />

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 lg:flex"
          aria-label="Primary"
        >
          {navLinks.map((l) => {
            const active = l.href === "/bnhub" ? p.startsWith("/bnhub") : p === l.href || p.startsWith(`${l.href}/`);
            return (
            <Link
              key={l.href}
              href={l.href}
              className={navLinkClass(active)}
              aria-current={active ? "page" : undefined}
            >
              {l.label}
            </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/auth/login"
            className="hidden min-h-[44px] items-center rounded-2xl border border-[#D4AF37]/50 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 lg:inline-flex"
          >
            Login
          </Link>
          <button
            type="button"
            className="lecipm-touch flex h-11 min-w-[44px] items-center justify-center rounded-2xl border border-[#D4AF37]/40 text-[#D4AF37] lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[#D4AF37]/15 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] lg:hidden">
          <nav className="lecipm-mobile-nav-scroll flex w-full flex-col gap-3" aria-label="Mobile primary">
            {navLinks.map((l) => {
              const active = l.href === "/bnhub" ? p.startsWith("/bnhub") : p === l.href || p.startsWith(`${l.href}/`);
              return (
              <Link
                key={l.href}
                href={l.href}
                className={`lecipm-prestige-pill lecipm-neon-white-muted lecipm-touch flex min-h-[52px] w-full shrink-0 items-center justify-center px-5 py-3.5 text-base font-semibold leading-snug active:opacity-90 ${active ? "border-premium-gold/55 bg-premium-gold/10 text-premium-gold" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
              );
            })}
            <Link
              href="/auth/login"
              className="lecipm-prestige-pill lecipm-neon-gold lecipm-touch mt-1 flex min-h-[52px] w-full shrink-0 items-center justify-center px-5 py-3.5 text-base font-semibold leading-snug active:opacity-90"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
