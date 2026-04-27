import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import type { SyriaPropertyType } from "@/generated/prisma";
import { sy8FeedExtraWhere } from "@/lib/sy8/sy8-feed-visibility";
import { getSy8OwnerListingCountsMap } from "@/lib/sy8/sy8-owner-listing-counts";
import {
  computeSy8SellerScore,
  isSy8SellerVerified,
  sy8ReputationLabelId,
} from "@/lib/sy8/sy8-reputation";

export async function RelatedListings({
  excludeId,
  city,
  type,
  locale,
}: {
  excludeId: string;
  city: string;
  type: SyriaPropertyType;
  locale: string;
}) {
  const t = await getTranslations("Listing");
  const rows = await prisma.syriaProperty.findMany({
    where: {
      id: { not: excludeId },
      city,
      type,
      status: "PUBLISHED",
      fraudFlag: false,
      ...sy8FeedExtraWhere,
    },
    orderBy: [
      { isDirect: "desc" },
      { owner: { verifiedAt: { sort: "desc", nulls: "last" } } },
      { plan: "desc" },
      { createdAt: "desc" },
    ],
    take: 4,
    include: { owner: { select: { phoneVerifiedAt: true, verifiedAt: true, verificationLevel: true } } },
  });

  if (rows.length === 0) return null;

  const countMap = await getSy8OwnerListingCountsMap(rows.map((r) => r.ownerId));
  const cards = rows.map((l) => {
    const { owner, ...rest } = l;
    const c = countMap.get(l.ownerId) ?? { activeListings: 0, soldListings: 0 };
    const sy8ReputationScore = computeSy8SellerScore(c.soldListings, c.activeListings);
    return (
      <ListingCard
        key={l.id}
        listing={{
          ...rest,
          sy8SellerVerified: isSy8SellerVerified(owner),
          sy8ReputationScore,
          sy8ReputationLabelId: sy8ReputationLabelId(sy8ReputationScore),
        }}
        locale={locale}
      />
    );
  });

  return (
    <section className="border-t border-[color:var(--darlink-border)] pt-10">
      <h2 className="text-xl font-semibold text-[color:var(--darlink-text)]">{t("relatedTitle")}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards}</div>
    </section>
  );
}
