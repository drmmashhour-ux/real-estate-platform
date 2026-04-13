import type { ReactNode } from "react";
import Link from "next/link";

const sublinks = [
  { href: "/pricing", label: "Overview" },
  { href: "/pricing/buyer", label: "Buyer" },
  { href: "/pricing/seller", label: "Seller" },
  { href: "/pricing/bnhub", label: "BNHUB" },
  { href: "/pricing/broker", label: "Broker" },
];

export default function PricingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-white/5">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <nav aria-label="Pricing sections" className="flex flex-wrap gap-2 pb-4">
          {sublinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-premium-gold/40 hover:text-premium-gold"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
