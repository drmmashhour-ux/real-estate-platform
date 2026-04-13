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

const INSURANCE_LINK = { href: "/dashboard/insurance", label: "Insurance" } as const;

/**
 * Logged-in marketplace shortcuts (role-agnostic; dashboards enforce access).
 */
export function MarketplaceHubLinks() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/marketplace")
      .then(async (r) => {
        if (!cancelled && r.ok) {
          setVisible(true);
          try {
            const j = (await r.json()) as { role?: string };
            const role = String(j.role ?? "").toUpperCase();
            setShowInsurance(role === "INSURANCE_BROKER" || role === "ADMIN");
          } catch {
            setShowInsurance(false);
          }
        } else if (!cancelled) {
          setVisible(false);
        }
      })
      .catch(() => {
        if (!cancelled) setVisible(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  const extra = showInsurance ? [INSURANCE_LINK] : [];

  return (
    <li className="relative list-none">
      <div className="flex flex-wrap items-center justify-center gap-0.5 lg:gap-1" aria-label="Hub dashboards (signed in)">
        {[...LINKS, ...extra].map(({ href, label }) => {
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
                  ? "bg-premium-gold/12 text-premium-gold ring-1 ring-premium-gold/40"
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
