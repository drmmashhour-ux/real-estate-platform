import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import type { SyriaPropertyType } from "@/generated/prisma";

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
    },
    orderBy: [{ plan: "desc" }, { createdAt: "desc" }],
    take: 4,
  });

  if (rows.length === 0) return null;

  const cards = rows.map((l) => <ListingCard key={l.id} listing={l} locale={locale} />);

  return (
    <section className="border-t border-[color:var(--darlink-border)] pt-10">
      <h2 className="text-xl font-semibold text-[color:var(--darlink-text)]">{t("relatedTitle")}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards}</div>
    </section>
  );
}
