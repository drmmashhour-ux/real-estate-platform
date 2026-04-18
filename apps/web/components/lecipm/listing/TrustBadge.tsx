"use client";

import { ListingBadges } from "@/components/listings/ListingBadges";

export type TrustBadgeProps = { verified?: boolean; className?: string };

export function TrustBadge({ verified, className }: TrustBadgeProps) {
  return <ListingBadges verified={verified} className={className} />;
}
