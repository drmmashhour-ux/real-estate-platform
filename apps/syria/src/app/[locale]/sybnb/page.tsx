import { getLocale, getTranslations } from "next-intl/server";
import { SybnbHero } from "@/components/sybnb/SybnbHero";
import { SybnbUrgencyStrip } from "@/components/sybnb/SybnbUrgencyStrip";
import { SybnbCategoryChips } from "@/components/sybnb/SybnbCategoryChips";
import { SybnbLatestStaysGrid } from "@/components/sybnb/SybnbLatestStaysGrid";
import { SybnbHomeTrustStrip } from "@/components/sybnb/SybnbHomeTrustStrip";
import { BrowseExperienceClient } from "@/components/browse/BrowseExperienceClient";
import { BrowseMvpExperienceClient } from "@/components/browse/BrowseMvpExperienceClient";
import { syriaFlags } from "@/lib/platform-flags";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { parseUtmFromSearchParams } from "@/lib/utm";
import { flattenSearchParams } from "@/lib/property-search";
import { searchProperties, fetchSybnbVerifiedHotelsStrip, type SerializedBrowseListing } from "@/services/search/search.service";
import { getSybnbLatestStays, getSybnbPublicListingCount } from "@/lib/sybnb/sybnb-public-data";
import { sybnbSoftLaunchUrgencyMessaging } from "@/lib/sybnb/config";
import { SybnbBrandSocialProofStrip } from "@/components/sybnb/SybnbBrandSocialProofStrip";
import { SybnbCityFocusChips } from "@/components/sybnb/SybnbCityFocusChips";

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
  const [initialResult, hotelStripItems] = await Promise.all([
    searchProperties("stay", flat),
    syriaFlags.SYRIA_MVP ? Promise.resolve<SerializedBrowseListing[]>([]) : fetchSybnbVerifiedHotelsStrip(flat),
  ]);
  const [liveCount, latestStays] = await Promise.all([getSybnbPublicListingCount(), getSybnbLatestStays(8)]);
  const tH = await getTranslations("Sybnb.home");

  return (
    <div className="space-y-10">
      <SybnbHero />
      <SybnbBrandSocialProofStrip />
      <p className="text-center text-sm font-medium text-neutral-800 [dir=rtl]:text-right">{tH("liveStaysCount", { count: liveCount })}</p>
      <SybnbUrgencyStrip liveCount={liveCount} emphasisStrong={sybnbSoftLaunchUrgencyMessaging()} />
      <SybnbCityFocusChips />
      <div className="space-y-6">
        <SybnbCategoryChips />
        <SybnbLatestStaysGrid items={latestStays} locale={locale} />
      </div>
      <SybnbHomeTrustStrip />

      <section className="space-y-3">
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
            hotelStripItems={hotelStripItems}
          />
        )}
      </section>
    </div>
  );
}
