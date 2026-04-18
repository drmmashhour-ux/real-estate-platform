"use client";

import { ListingBadges } from "@/components/listings/ListingBadges";

export type PriceDropBadgeProps = { active?: boolean; className?: string };

export function PriceDropBadge({ active, className }: PriceDropBadgeProps) {
  return <ListingBadges priceDropped={active} className={className} />;
}
