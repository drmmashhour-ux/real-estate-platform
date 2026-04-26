import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { SyriaProperty } from "@/generated/prisma";
import { pickListingTitle } from "@/lib/listing-localized";
import {
  SELF_MKT_MIN_AMENITIES_FOR_QUALITY,
  SELF_MKT_VIEWS_FEATURED_UPSELL_MIN,
  SELF_MKT_VIEWS_SHARE_REMINDER_MAX,
} from "@/lib/self-marketing";

function imageCount(imgs: string[]): number {
  return imgs.filter((x) => typeof x === "string" && x.length > 0).length;
}
function amenityCount(am: string[]): number {
  return am.filter((x) => typeof x === "string" && x.length > 0).length;
}

export async function SelfMarketingPanel({ listings }: { listings: SyriaProperty[] }) {
  const t = await getTranslations("SelfMarketing");
  const locale = await getLocale();
  const published = listings.filter((l) => l.status === "PUBLISHED" && !l.fraudFlag);
  if (published.length === 0) return null;

  const needShare = published.filter((l) => (l.views ?? 0) <= SELF_MKT_VIEWS_SHARE_REMINDER_MAX);
  const upsellFeat = published.filter(
    (l) => l.plan === "free" && (l.views ?? 0) >= SELF_MKT_VIEWS_FEATURED_UPSELL_MIN,
  );
  const lowQ = published.filter(
    (l) => imageCount(l.images) === 0 || amenityCount(l.amenities) < SELF_MKT_MIN_AMENITIES_FOR_QUALITY,
  );

  if (needShare.length === 0 && upsellFeat.length === 0 && lowQ.length === 0) return null;

  return (
    <div className="space-y-3">
      {needShare.length > 0 ? (
        <div className="rounded-[var(--darlink-radius-2xl)] border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 shadow-[var(--darlink-shadow-sm)]">
          <p className="font-semibold">{t("reminderShare")}</p>
          <ul className="mt-2 list-inside list-disc text-xs text-amber-900/95">
            {needShare.slice(0, 4).map((l) => (
              <li key={l.id}>
                <Link href={`/listing/${l.id}`} className="font-medium text-amber-950 underline">
                  {pickListingTitle(l, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {upsellFeat.length > 0 ? (
        <div className="rounded-[var(--darlink-radius-2xl)] border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-950 shadow-[var(--darlink-shadow-sm)]">
          <p className="font-semibold">{t("upsellFeatured")}</p>
          {upsellFeat.slice(0, 1).map((l) => (
            <Link
              key={l.id}
              href={`/listing/${l.id}`}
              className="mt-2 inline-flex min-h-11 w-full max-w-sm items-center justify-center rounded-[var(--darlink-radius-xl)] bg-[var(--hadiah-btn)] px-4 text-sm font-bold text-white hover:opacity-95"
            >
              {t("upsellCta")}
            </Link>
          ))}
        </div>
      ) : null}
      {lowQ.length > 0 ? (
        <div className="rounded-[var(--darlink-radius-2xl)] border border-stone-200 bg-stone-50/90 px-4 py-3 text-sm text-stone-900">
          <p className="font-semibold">{t("improveQuality")}</p>
          <ul className="mt-1 list-inside list-disc text-xs text-stone-700">
            {lowQ.slice(0, 3).map((l) => (
              <li key={l.id}>
                <Link href={`/listing/${l.id}`} className="font-medium text-[color:var(--darlink-accent)] underline">
                  {pickListingTitle(l, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
