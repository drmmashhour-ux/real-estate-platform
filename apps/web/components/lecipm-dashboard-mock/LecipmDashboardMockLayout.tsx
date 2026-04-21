"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";

const NAV: { href: string; label: string; embellish?: string }[] = [
  { href: "/design/lecipm-dashboard", label: "Dashboard" },
  { href: "/design/lecipm-dashboard/listings", label: "Listings" },
  { href: "/design/lecipm-dashboard/listing-assistant", label: "Listing Assistant", embellish: "✨" },
  { href: "/design/lecipm-dashboard/deals", label: "Deals" },
  { href: "/design/lecipm-dashboard/leads", label: "Leads" },
  { href: "/design/lecipm-dashboard/compliance", label: "Compliance", embellish: "🛡️" },
  { href: "/design/lecipm-dashboard/investment", label: "Investment" },
  { href: "/design/lecipm-dashboard/settings", label: "Settings" },
];

function routeMatches(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const p = pathname.replace(/\/$/, "");
  const h = href.startsWith("/") ? href : `/${href}`;
  return p.endsWith(h);
}

export function LecipmDashboardMockLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-ds-bg text-ds-text">
      {/* subtle top-right glow */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_900px_520px_at_100%_0%,rgba(212,175,55,0.07),transparent_55%)]"
        aria-hidden
      />

      <aside className="relative z-10 flex w-[260px] shrink-0 flex-col border-r border-ds-border bg-black">
        <div className="border-b border-ds-border px-5 py-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-soft-gold">LECIPM</p>
          <p className="mt-1 text-sm font-semibold text-white">Broker OS</p>
          <MockBadgeRow />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
          {NAV.map((item) => {
            const active = routeMatches(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-ds-gold/10 text-ds-gold shadow-[inset_0_0_0_1px_rgba(212,175,55,0.35)]"
                    : "text-ds-text-secondary hover:bg-ds-surface hover:text-white hover:shadow-[0_0_20px_rgba(212,175,55,0.08)]"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{item.label}</span>
                  {item.embellish ? <span className="text-xs opacity-90">{item.embellish}</span> : null}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ds-border px-5 py-4 text-[10px] leading-relaxed text-ds-text-secondary">
          UI mock · presentation layer · no live data
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-ds-border bg-black/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-medium text-ds-text-secondary sm:inline">Workspace</span>
            <span className="rounded-md border border-ds-border bg-ds-surface px-2 py-1 text-[10px] text-ds-text-secondary">
              Québec · OACIQ-aligned surfaces
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-ds-border px-3 py-1.5 text-xs font-medium text-ds-text-secondary transition hover:border-ds-gold/40 hover:text-ds-gold"
            >
              Search
            </button>
            <div className="h-8 w-8 rounded-full border border-ds-gold/30 bg-gradient-to-br from-ds-gold/25 to-transparent" />
          </div>
        </header>
        <main className="min-h-[calc(100vh-3.5rem)] flex-1 overflow-auto p-6 md:p-8 [&_h1]:font-[family-name:var(--font-lecipm-mock-heading)] [&_h2]:font-[family-name:var(--font-lecipm-mock-heading)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function MockBadgeRow() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <span className="rounded-full border border-ds-gold/35 bg-ds-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ds-gold">
        Insured Broker
      </span>
      <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ds-text-secondary">
        AI Optimized
      </span>
    </div>
  );
}
