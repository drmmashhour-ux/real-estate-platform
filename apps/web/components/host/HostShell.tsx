"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

function NavLink({ href, label, onNavigate }: { href: string; label: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/host" && pathname.startsWith(href + "/"));
  return (
    <Link
      href={href}
      onClick={onNavigate}
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

export function HostShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-zinc-700 p-2 text-zinc-300 md:hidden"
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/host" className="text-lg font-bold tracking-tight" style={{ color: GOLD }}>
              LECIPM Host
            </Link>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>
        </div>
        {open ? (
          <div className="border-t border-zinc-800 px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
