import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { pickListingTitle } from "@/lib/listing-localized";
import { analyzeListingQuality } from "@/lib/listing-quality";
import { DarlinkSellerAutopilotHints } from "@/components/dashboard/DarlinkSellerAutopilotHints";
import { getSyriaPublicOrigin } from "@/lib/syria-whatsapp";
import { buildViralShareForSyriaProperty } from "@/lib/syria/viral-listing-share";
import { SelfMarketingPanel } from "@/components/dashboard/SelfMarketingPanel";
import { ViralPostShareBanner } from "@/components/dashboard/ViralPostShareBanner";
import { duplicateOwnListingFormAction } from "@/actions/duplicate-listing";

function planLabelKey(plan: string): "planFree" | "planFeatured" | "planPremium" | "planHotelFeatured" {
  if (plan === "featured") return "planFeatured";
  if (plan === "premium") return "planPremium";
  if (plan === "hotel_featured") return "planHotelFeatured";
  return "planFree";
}

function tierKey(plan: string): "statusNormal" | "statusFeatured" {
  if (plan === "free") return "statusNormal";
  return "statusFeatured";
}

type DashboardListingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardListingsPage({ searchParams }: DashboardListingsPageProps) {
  const t = await getTranslations("Dashboard");
  const locale = await getLocale();
  const sp = await searchParams;
  const showShareCta = sp.posted === "1";
  const numberLoc = locale.startsWith("ar") ? "ar-SY" : "en-US";
  const user = await requireSessionUser();

  const origin = getSyriaPublicOrigin();

  const listings = await prisma.syriaProperty.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const newest = listings[0];
  const newestViral = newest
    ? buildViralShareForSyriaProperty(newest, locale, numberLoc, origin)
    : null;

  return (
    <div className="space-y-4">
      {showShareCta && newestViral ? (
        <ViralPostShareBanner
          whatsappHref={newestViral.whatsappHref}
          canonicalListingUrl={newestViral.canonicalUrl}
        />
      ) : null}
      <SelfMarketingPanel listings={listings} />
      <DarlinkSellerAutopilotHints listingIds={listings.map((l) => l.id)} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--darlink-text)]">{t("listingsTitle")}</h2>
          <p className="text-sm text-[color:var(--darlink-text-muted)]">{t("listingsSubtitle")}</p>
        </div>
        <Link
          href="/sell"
          className="hadiah-btn-primary inline-flex w-full min-h-[44px] items-center justify-center rounded-[var(--darlink-radius-xl)] px-4 py-2 text-sm font-semibold sm:w-auto"
        >
          {t("newListing")}
        </Link>
      </div>
      {listings.length === 0 ? (
        <p className="rounded-[var(--darlink-radius-2xl)] border border-dashed border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-8 text-sm text-[color:var(--darlink-text-muted)]">
          {t("listingsEmpty")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">{t("tableTitle")}</th>
                <th className="px-4 py-3">{t("tableCity")}</th>
                <th className="px-4 py-3">{t("tablePrice")}</th>
                <th className="px-4 py-3">{t("tableQuality")}</th>
                <th className="px-4 py-3">{t("tableTier")}</th>
                <th className="px-4 py-3">{t("tableViews")}</th>
                <th className="px-4 py-3">{t("tableLeadsWhatsapp")}</th>
                <th className="px-4 py-3">{t("tableLeadsPhone")}</th>
                <th className="px-4 py-3">{t("tablePlan")}</th>
                <th className="px-4 py-3">{t("tableStatus")}</th>
                <th className="px-4 py-3">{t("tableDuplicate")}</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const q = analyzeListingQuality(l);
                const lowViewsViral =
                  l.status === "PUBLISHED" && (l.views ?? 0) < 5
                    ? buildViralShareForSyriaProperty(l, locale, numberLoc, origin)
                    : null;
                return (
                <tr key={l.id} className="border-t border-[color:var(--darlink-border)]">
                  <td className="px-4 py-3 font-medium text-[color:var(--darlink-text)]">
                    {l.status === "PUBLISHED" ? (
                      <Link href={`/listing/${l.id}`} className="hover:underline">
                        {pickListingTitle(l, locale)}
                      </Link>
                    ) : (
                      <span>{pickListingTitle(l, locale)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--darlink-text-muted)]">{l.city}</td>
                  <td className="px-4 py-3">{money(l.price, l.currency, numberLoc)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{q.score}</span>
                    {q.issues.length > 0 ? (
                      <p className="mt-1 max-w-xs text-xs text-[color:var(--darlink-text-muted)]">
                        {locale.startsWith("ar") ? q.issues[0].messageAr : q.issues[0].messageEn}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--darlink-text)]">{t(tierKey(l.plan))}</td>
                  <td className="px-4 py-3 text-[color:var(--darlink-text)]">
                    <span className="tabular-nums">{t("tableViewsValue", { count: l.views ?? 0 })}</span>
                    {lowViewsViral ? (
                      <div className="mt-1 max-w-xs space-y-1.5">
                        <p className="text-xs text-amber-800">{t("shareForViewsHint")}</p>
                        <a
                          href={lowViewsViral.whatsappHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-9 w-full min-w-0 max-w-[12rem] items-center justify-center rounded-lg bg-emerald-600 px-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          {t("lowViewsShareCta")}
                        </a>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[color:var(--darlink-text)]">{l.whatsappClicks ?? 0}</td>
                  <td className="px-4 py-3 tabular-nums text-[color:var(--darlink-text)]">{l.phoneClicks ?? 0}</td>
                  <td className="px-4 py-3 text-[color:var(--darlink-text)] text-xs">{t(planLabelKey(l.plan))}</td>
                  <td className="px-4 py-3 text-[color:var(--darlink-text)] text-xs">{l.status}</td>
                  <td className="px-4 py-3">
                    <form action={duplicateOwnListingFormAction}>
                      <input type="hidden" name="listingId" value={l.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] px-2 py-1 text-[11px] font-semibold text-[color:var(--darlink-accent)] hover:bg-[color:var(--darlink-surface)]"
                      >
                        {t("duplicateDraftCta")}
                      </button>
                    </form>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
