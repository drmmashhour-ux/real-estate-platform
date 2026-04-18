"use client";

import Link from "next/link";
import { TrustBadge } from "./TrustBadge";

export type ListingCardV2Props = {
  id: string;
  href: string;
  title: string;
  city: string;
  nightPriceCents: number;
  photoUrl: string | null;
  verified?: boolean;
  topHost?: boolean;
  reviewAvg?: number | null;
  reviewCount?: number;
};

export function ListingCardV2(props: ListingCardV2Props) {
  const { href, title, city, nightPriceCents, photoUrl, verified, topHost, reviewAvg, reviewCount } = props;
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-premium-gold/40"
    >
      <div className="relative aspect-[4/3] w-full bg-neutral-900">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="line-clamp-2 text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-neutral-500">{city}</p>
        </div>
        <TrustBadge verified={verified} topHost={topHost} />
        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-lg font-semibold text-premium-gold">${(nightPriceCents / 100).toFixed(0)}</p>
            <p className="text-xs text-neutral-500">per night</p>
          </div>
          {reviewCount != null && reviewCount > 0 && (
            <p className="text-xs text-neutral-400">
              ★ {reviewAvg?.toFixed(1) ?? "—"} ({reviewCount})
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
