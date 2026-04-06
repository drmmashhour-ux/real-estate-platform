"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/ui/Logo";

const navLinks = [
  { href: "/buying", label: "Buy" },
  { href: "/bnhub/stays", label: "Rent" },
  { href: "/bnhub", label: "BNHub" },
  { href: "/investors", label: "Invest" },
  { href: "/list-your-property", label: "List Property" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#D4AF37]/20 bg-black/95 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="LECIPM home">
          <BrandLogo variant="icon" href={null} priority className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="text-lg font-bold tracking-tight text-[#D4AF37]">LECIPM</span>
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
          aria-label="Primary"
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap text-sm font-medium text-white transition hover:text-[#D4AF37]"
            >
              {l.label}
            </Link>
          ))}
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
            className="flex h-11 min-w-[44px] items-center justify-center rounded-2xl border border-[#D4AF37]/40 text-[#D4AF37] lg:hidden"
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
        <div className="border-t border-[#D4AF37]/15 px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile primary">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="min-h-[48px] rounded-2xl px-4 py-3 text-base font-medium text-white hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/auth/login"
              className="mt-2 flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-[#D4AF37] text-base font-semibold text-[#D4AF37]"
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
