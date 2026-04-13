"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { href: string; label: string }[] = [
  { href: "/admin/investor", label: "Home" },
  { href: "/admin/investor/pitch", label: "Pitch" },
  { href: "/admin/investor/metrics", label: "Metrics" },
  { href: "/admin/investor/financials", label: "Financials" },
  { href: "/admin/investor/qa", label: "Q&A" },
  { href: "/admin/investor/simulation", label: "Simulation" },
];

function pathMatches(path: string, href: string): boolean {
  if (href === "/admin/investor") {
    return /\/admin\/investor\/?$/.test(path);
  }
  return path.includes(href);
}

export function InvestorHubNav() {
  const path = usePathname() ?? "";
  return (
    <nav className="border-b border-amber-900/40 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3 sm:px-6">
        <span className="mr-4 text-xs font-semibold uppercase tracking-[0.25em] text-amber-500/90">Investor</span>
        {LINKS.map((l) => {
          const active = pathMatches(path, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/40"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-amber-100/90"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        <Link
          href="/admin/pitch-deck"
          className="ml-auto text-xs text-zinc-500 underline-offset-4 hover:text-amber-200/90 hover:underline"
        >
          Edit deck
        </Link>
      </div>
    </nav>
  );
}
