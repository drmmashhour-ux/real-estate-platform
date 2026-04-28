import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { SyriaProperty } from "@/generated/prisma";
import { getSy8OwnerListingCountsMap } from "@/lib/sy8/sy8-owner-listing-counts";
import { SybnbListingCard } from "@/components/sybnb/SybnbListingCard";
import { computeSybnbExcellentDealFlags } from "@/lib/sybnb/smart-pricing";

type Row = SyriaProperty & {
  owner: { phoneVerifiedAt: Date | null; verifiedAt: Date | null; verificationLevel: string | null };
};

type Props = { items: Row[]; locale: string };

export async function SybnbLatestStaysGrid({ items, locale }: Props) {
  const t = await getTranslations("Sybnb.home");
  const ownerMap = await getSy8OwnerListingCountsMap(items.map((i) => i.ownerId));

  const dealFlags = computeSybnbExcellentDealFlags(
    items.map((p) => ({
      id: p.id,
      state: p.state,
      governorate: p.governorate,
      pricePerNight: p.pricePerNight,
      price: p.price.toString(),
      currency: p.currency,
      images: p.images,
      verified: p.verified,
      listingVerified: p.listingVerified,
    })),
  );

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center text-sm text-neutral-500">
        {t("emptyLatest")}
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">{t("latestTitle")}</h2>
        <Link href="/sybnb" className="text-sm font-medium text-amber-800 underline-offset-2 hover:underline">
          {t("seeAll")}
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => {
          const c = ownerMap.get(p.ownerId) ?? { activeListings: 0, soldListings: 0 };
          return (
            <SybnbListingCard
              key={p.id}
              property={p}
              locale={locale}
              activeListings={c.activeListings}
              soldListings={c.soldListings}
              showExcellentDeal={dealFlags.get(p.id) === true}
            />
          );
        })}
      </ul>
    </section>
  );
}
