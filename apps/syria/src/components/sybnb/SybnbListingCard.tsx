import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLocalizedPropertyCity } from "@/lib/property-localization";
import { money } from "@/lib/format";
import { pickListingTitle } from "@/lib/listing-localized";
import { SybnbListingCoverImage } from "@/components/sybnb/SybnbListingCoverImage";
import type { SyriaProperty } from "@/generated/prisma";
import { SybnbTrustBadge } from "@/components/sybnb/SybnbTrustBadge";

type Row = SyriaProperty & {
  owner: { phoneVerifiedAt: Date | null; verifiedAt: Date | null; verificationLevel: string | null };
};

type Props = {
  property: Row;
  locale: string;
  activeListings: number;
  soldListings: number;
  showExcellentDeal?: boolean;
};

/**
 * One SYBNB stay card (grid / carousels). Use with counts from `getSy8OwnerListingCountsMap` or precomputed.
 */
export async function SybnbListingCard({ property: p, locale, activeListings, soldListings, showExcellentDeal }: Props) {
  const t = await getTranslations("Sybnb.home");
  const tListing = await getTranslations("Sybnb.listing");
  const tSp = await getTranslations("Sybnb.smartPricing");
  const cover = p.images[0] ?? null;
  const city = getLocalizedPropertyCity(p, locale);
  const price = p.pricePerNight != null ? p.pricePerNight : p.price.toString();
  return (
    <li>
      <Link
        href={`/sybnb/listings/${p.id}`}
        className="group block overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition hover:border-amber-200/60 hover:shadow-md"
      >
        <div className="relative aspect-[4/3] bg-neutral-100">
          {cover ?
            <SybnbListingCoverImage src={cover} />
          : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">—</div>
          )}
          {showExcellentDeal ? (
            <span className="absolute left-2 top-2 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white shadow ring-1 ring-teal-300/80">
              {tSp("excellentDealBadge")}
            </span>
          ) : null}
          {p.type === "HOTEL" ? (
            <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 ring-1 ring-amber-300/70">
              {tListing("badgeHotel")}
            </span>
          ) : null}
        </div>
        <div className="p-3">
          <p className="line-clamp-1 text-sm font-semibold text-neutral-900 group-hover:text-amber-900">
            {pickListingTitle(p, locale)}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">{city}</p>
          <div className="mt-1">
            <SybnbTrustBadge
              owner={p.owner}
              activeListings={activeListings}
              soldListings={soldListings}
              className="text-xs font-medium text-neutral-700"
            />
          </div>
          <p className="mt-2 text-sm font-bold tabular-nums text-neutral-900">
            {money(price, p.currency)} <span className="text-xs font-normal text-neutral-500">/ {t("night")}</span>
          </p>
        </div>
      </Link>
    </li>
  );
}
