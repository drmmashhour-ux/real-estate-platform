"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hubNavActive } from "@/lib/hubs/nav";

const ITEMS = [
  { hub: "buy" as const, href: "/buy", label: "Buy" },
  { hub: "sell" as const, href: "/sell", label: "Sell" },
  { hub: "rent" as const, href: "/rent", label: "Rent" },
  { hub: "mortgage" as const, href: "/mortgage", label: "Mortgage" },
];

/**
 * Primary hub navigation — visible on all breakpoints (paired with MvpNav).
 */
export function HubNavLinks() {
  const pathname = usePathname() ?? "/";

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-1 sm:gap-2"
      aria-label="Product hubs"
    >
      {ITEMS.map(({ hub, href, label }) => {
        const active = hubNavActive(hub, pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              active
                ? "bg-[#C9A646]/18 text-[#F0E6C8] ring-1 ring-[#C9A646]/50"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
