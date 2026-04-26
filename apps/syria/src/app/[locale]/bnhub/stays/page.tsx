import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { syriaFlags } from "@/lib/platform-flags";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
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

export default async function BnhubStaysPage(props: Props) {
  const t = await getTranslations("Bnhub");
  const locale = await getLocale();
  const spRaw = await props.searchParams;
  const flat = flattenSearchParams(spRaw);

  if (!syriaFlags.BNHUB_ENABLED) {
    return (
      <Card className="border-[color:var(--darlink-border)] p-8 shadow-[var(--darlink-shadow-md)]">
        <h1 className="text-2xl font-semibold text-[color:var(--darlink-text)]">{t("disabledTitle")}</h1>
        <p className="mt-2 text-sm text-[color:var(--darlink-text-muted)]">{t("disabledBody")}</p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-semibold text-[color:var(--darlink-accent)] hover:underline"
        >
          {t("backHome")}
        </Link>
      </Card>
    );
  }

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
        surface: "bnhub",
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
  const initialResult = await searchProperties("bnhub", flat);

  return (
    <div className="space-y-8">
      <SectionHeading title={t("title")} description={t("subtitle")} />
      <BrowseExperienceClient
        surface="bnhub"
        basePath="/bnhub/stays"
        locale={locale}
        initialQs={initialQs}
        initialResult={initialResult}
      />
    </div>
  );
}
