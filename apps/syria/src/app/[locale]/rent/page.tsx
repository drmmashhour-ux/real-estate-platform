import { getLocale, getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BrowseExperienceClient } from "@/components/browse/BrowseExperienceClient";
import { BrowseMvpExperienceClient } from "@/components/browse/BrowseMvpExperienceClient";
import { syriaFlags } from "@/lib/platform-flags";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { parseUtmFromSearchParams } from "@/lib/utm";
import { flattenSearchParams } from "@/lib/property-search";
import { getCachedBrowseSearch } from "@/lib/cache/darlink-browse-search";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toInitialQs(flat: Record<string, string>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(flat)) {
    if (v) usp.set(k, v);
  }
  return usp.toString();
}

/** ORDER SYBNB-82 / SYBNB-104 — sync literal with `SYRIA_PUBLIC_SEGMENT_REVALIDATE_SECONDS`. */
export const revalidate = 45;

export default async function RentPage(props: Props) {
  const t = await getTranslations("Rent");
  const locale = await getLocale();
  const spRaw = await props.searchParams;
  const flat = flattenSearchParams(spRaw);

  const q = (flat.q ?? "").trim();
  const city = (flat.city ?? "").trim();

  if (q || city || (flat.area ?? "").trim()) {
    const utmParsed = parseUtmFromSearchParams(spRaw);
    await trackSyriaGrowthEvent({
      eventType: "search_performed",
      payload: {
        q,
        city,
        area: (flat.area ?? "").trim(),
        surface: "rent",
        sort: flat.sort ?? "featured",
      },
      utm: {
        source: utmParsed.utmSource,
        medium: utmParsed.utmMedium,
        campaign: utmParsed.utmCampaign,
      },
    });
  }

  const initialQs = toInitialQs(flat);
  const initialResult = await getCachedBrowseSearch("rent", flat);

  return (
    <div className="space-y-8">
      <SectionHeading title={t("title")} description={t("subtitle")} />
      {syriaFlags.SYRIA_MVP ? (
        <BrowseMvpExperienceClient surface="rent" basePath="/rent" locale={locale} initialResult={initialResult} />
      ) : (
        <BrowseExperienceClient
          surface="rent"
          basePath="/rent"
          locale={locale}
          initialQs={initialQs}
          initialResult={initialResult}
        />
      )}
    </div>
  );
}
