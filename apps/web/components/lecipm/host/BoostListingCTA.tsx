"use client";

import Link from "next/link";

export type BoostListingCTAProps = {
  listingId: string;
  href?: string;
  className?: string;
};

/** CTA to seller listing management where hosted Stripe “Boost” checkout is triggered. */
export function BoostListingCTA({ listingId, href, className = "" }: BoostListingCTAProps) {
  const to = href ?? `/dashboard/seller/listings/${listingId}`;
  return (
    <Link
      href={to}
      className={`inline-flex items-center justify-center rounded-full bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black shadow-lg transition hover:bg-[#E8D589] ${className}`}
    >
      Boost listing visibility
    </Link>
  );
}
