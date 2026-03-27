"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/listings", label: "Listings" },
  { href: "/dashboard/buyer", label: "Buyer" },
  { href: "/dashboard/seller", label: "Seller" },
  { href: "/dashboard/broker", label: "Broker" },
  { href: "/dashboard/mortgage", label: "Mortgage" },
] as const;

/**
 * Logged-in marketplace shortcuts (role-agnostic; dashboards enforce access).
 */
export function MarketplaceHubLinks() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/marketplace")
      .then((r) => {
        if (!cancelled) setVisible(r.ok);
      })
      .catch(() => {
        if (!cancelled) setVisible(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  return (
    <li className="relative list-none">
      <div className="flex flex-wrap items-center justify-center gap-0.5 lg:gap-1" aria-label="Hub dashboards (signed in)">
        {LINKS.map(({ href, label }) => {
          const active =
            href === "/listings"
              ? pathname.startsWith("/listings")
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-2 py-2 text-xs font-medium transition sm:px-2.5 ${
                active
                  ? "bg-[#C9A646]/12 text-[#E8D5A3] ring-1 ring-[#C9A646]/40"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </li>
  );
}
