"use client";

import type { TrustBadge } from "@/modules/trust/trust.types";

type Props = {
  badges: TrustBadge[];
  className?: string;
};

const LABEL: Record<TrustBadge, string> = {
  verified_owner: "Verified owner",
  verified_host: "Verified host",
  trusted_broker: "Trusted broker",
  high_compliance: "Strong compliance checklist",
  premium_trusted: "Premium trust tier",
};

export function TrustBadgeList({ badges, className = "" }: Props) {
  if (badges.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Trust badges">
      {badges.map((b) => (
        <li
          key={b}
          className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100 ring-1 ring-emerald-500/35"
        >
          {LABEL[b]}
        </li>
      ))}
    </ul>
  );
}
