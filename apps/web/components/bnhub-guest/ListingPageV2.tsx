"use client";

import type { ReactNode } from "react";
import { TrustBadge } from "./TrustBadge";
import { StickyBookingCard } from "./StickyBookingCard";
import { SaveButton } from "./SaveButton";

export function ListingPageV2({
  title,
  city,
  nightPriceCents,
  verified,
  topHost,
  listingId,
  children,
}: {
  title: string;
  city: string;
  nightPriceCents: number;
  verified?: boolean;
  topHost?: boolean;
  listingId: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
            <p className="text-neutral-400">{city}</p>
          </div>
          <div className="flex items-center gap-2">
            <SaveButton listingId={listingId} />
          </div>
        </div>
        <div className="mt-3">
          <TrustBadge verified={verified} topHost={topHost} />
        </div>
        {children}
      </div>
      <aside>
        <StickyBookingCard nightPriceCents={nightPriceCents} />
      </aside>
    </div>
  );
}
