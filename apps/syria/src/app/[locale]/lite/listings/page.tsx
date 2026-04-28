import { getTranslations } from "next-intl/server";
import { fetchStayListingsPaged } from "@/lib/lite/lite-queries";
import { LiteListingsClient } from "@/components/lite/LiteListingsClient";

const INITIAL_LIMIT = 8;

export default async function UltraLiteListingsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations("UltraLite");
  const { items, hasMore, nextPage } = await fetchStayListingsPaged(locale, 1, INITIAL_LIMIT);

  return (
    <div>
      <h1 className="text-base font-bold text-neutral-900">{t("listingsTitle")}</h1>
      <p className="mb-3 text-[12px] text-neutral-700">{t("listingsSubtitle")}</p>
      <LiteListingsClient
        locale={locale}
        initialItems={items}
        initialHasMore={hasMore}
        initialNextPage={nextPage}
        initialLimit={INITIAL_LIMIT}
      />
    </div>
  );
}
