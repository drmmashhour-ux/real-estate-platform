"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CONTROL_TOWER_NAV_FLAT, CONTROL_TOWER_NAV_GROUPS } from "@/lib/admin/control-tower-nav";

const GOLD = "#D4AF37";

/** @deprecated Use CONTROL_TOWER_NAV_FLAT — kept for older imports. */
export const LECIPM_CONTROL_NAV = CONTROL_TOWER_NAV_FLAT;

export type ControlAlert = { id: string; title: string; detail: string; href: string; severity?: "low" | "medium" | "high" };

function activeFor(pathname: string, href: string) {
  if (href === "/admin/overview") {
    return pathname === "/admin/overview" || pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LecipmControlShell({
  children,
  alerts = [],
  showSearch = true,
}: {
  children: React.ReactNode;
  alerts?: ControlAlert[];
  showSearch?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const [navOpen, setNavOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [q, setQ] = useState("");

  const alertCount = alerts.length;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-zinc-800/90 bg-black/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            className="rounded-lg border border-zinc-700 p-2 text-zinc-300 lg:hidden"
            aria-label="Open navigation"
            onClick={() => setNavOpen((v) => !v)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/admin/overview" className="shrink-0 text-lg font-bold tracking-tight" style={{ color: GOLD }}>
            Control tower
          </Link>
          {showSearch ? (
            <form action="/admin/search" method="get" className="mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
              <input
                name="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search listings, bookings, users, hosts…"
                className="w-full rounded-2xl border border-zinc-800 bg-[#111] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600"
              />
            </form>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/admin/listings/stays"
              className="hidden rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-900 sm:inline-block"
            >
              Add listing
            </Link>
            <Link
              href="/admin/promotions"
              className="hidden rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-900 lg:inline-block"
            >
              Create promotion
            </Link>
            <Link
              href="/admin/reports"
              className="hidden rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-900 xl:inline-block"
            >
              Export report
            </Link>
            <Link
              href="/admin/alerts"
              className="hidden rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-900 sm:inline-block"
            >
              View alerts
            </Link>
            <div className="relative">
              <button
                type="button"
                className="relative rounded-xl border border-zinc-700 p-2 text-zinc-300 hover:bg-zinc-900"
                aria-label="Alerts"
                onClick={() => setBellOpen((v) => !v)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {alertCount > 0 ? (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-black" />
                ) : null}
              </button>
              {bellOpen ? (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-800 bg-[#111] p-3 shadow-xl">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Alerts</p>
                  {alerts.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-500">No critical alerts right now.</p>
                  ) : (
                    <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                      {alerts.map((a) => (
                        <li key={a.id}>
                          <Link
                            href={a.href}
                            className="block rounded-xl border border-zinc-800/80 bg-black/40 px-3 py-2 text-sm hover:bg-zinc-900"
                            onClick={() => setBellOpen(false)}
                          >
                            <span className="font-medium text-zinc-200">{a.title}</span>
                            <span className="mt-0.5 block text-xs text-zinc-500">{a.detail}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/admin/alerts"
                    className="mt-2 block text-center text-xs text-zinc-500 hover:text-zinc-300"
                    onClick={() => setBellOpen(false)}
                  >
                    All alerts →
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {showSearch ? (
          <form action="/admin/search" method="get" className="border-t border-zinc-800/80 px-4 pb-3 md:hidden">
            <input
              name="q"
              placeholder="Search…"
              className="w-full rounded-2xl border border-zinc-800 bg-[#111] px-4 py-2.5 text-sm text-white"
            />
          </form>
        ) : null}
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={`${navOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-800 bg-black pt-[4.5rem] transition lg:static lg:translate-x-0 lg:border-r lg:bg-transparent lg:pt-0`}
        >
          <nav className="space-y-4 px-3 py-4 lg:sticky lg:top-20">
            {CONTROL_TOWER_NAV_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = activeFor(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setNavOpen(false)}
                        className="block rounded-xl px-3 py-2 text-sm font-medium transition"
                        style={{
                          color: active ? GOLD : "rgb(161 161 170)",
                          backgroundColor: active ? "rgba(212, 175, 55, 0.12)" : "transparent",
                        }}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <Link
              href="/admin/reports/audit"
              className="mt-4 block rounded-xl px-3 py-2.5 text-sm text-zinc-500 hover:text-zinc-300"
              onClick={() => setNavOpen(false)}
            >
              Audit log
            </Link>
          </nav>
        </aside>
        {navOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/70 lg:hidden"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
