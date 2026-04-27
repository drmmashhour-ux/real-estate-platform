import { getLocale } from "next-intl/server";
import { SybnbHomeHero } from "@/components/sybnb/SybnbHomeHero";
import { BrowseExperienceClient } from "@/components/browse/BrowseExperienceClient";
import { BrowseMvpExperienceClient } from "@/components/browse/BrowseMvpExperienceClient";
import { syriaFlags } from "@/lib/platform-flags";
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

export default async function SybnbPage(props: Props) {
  const locale = await getLocale();
  const spRaw = await props.searchParams;
  const flatRaw = flattenSearchParams(spRaw);
  const flat: Record<string, string> = { ...flatRaw, category: "stay" };

  const q = (flat.q ?? "").trim();
  const city = (flat.city ?? "").trim();

  if (q || city) {
    const utmParsed = parseUtmFromSearchParams(spRaw);
    await trackSyriaGrowthEvent({
      eventType: "search_performed",
      payload: {
        q,
        city,
        surface: "sybnb",
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
  const initialResult = await searchProperties("stay", flat);

  return (
    <div className="space-y-8">
      <SybnbHomeHero />
      {syriaFlags.SYRIA_MVP ? (
        <BrowseMvpExperienceClient
          surface="stay"
          basePath="/sybnb"
          locale={locale}
          initialResult={initialResult}
          lockCategory="stay"
        />
      ) : (
        <BrowseExperienceClient
          surface="stay"
          basePath="/sybnb"
          locale={locale}
          initialQs={initialQs}
          initialResult={initialResult}
        />
      )}
    </div>
  );
}
