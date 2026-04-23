import { getLocale, getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BrowseExperienceClient } from "@/components/browse/BrowseExperienceClient";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { parseUtmFromSearchParams } from "@/lib/utm";
import { flattenSearchParams } from "@/lib/property-search";
import { searchProperties } from "@/services/search/search.service";

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
  const initialResult = await searchProperties("rent", flat);

  return (
    <div className="space-y-8">
      <SectionHeading title={t("title")} description={t("subtitle")} />
      <BrowseExperienceClient
        surface="rent"
        basePath="/rent"
        locale={locale}
        initialQs={initialQs}
        initialResult={initialResult}
      />
    </div>
  );
}
