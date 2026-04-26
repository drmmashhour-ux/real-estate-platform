import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { pickListingTitle } from "@/lib/listing-localized";
import { analyzeListingQuality } from "@/lib/listing-quality";
import { DarlinkSellerAutopilotHints } from "@/components/dashboard/DarlinkSellerAutopilotHints";
import { buildWhatsAppSendUrl, getSyriaPublicOrigin } from "@/lib/syria-whatsapp";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function planLabelKey(plan: string): "planFree" | "planFeatured" | "planPremium" {
  if (plan === "featured") return "planFeatured";
  if (plan === "premium") return "planPremium";
  return "planFree";
}

export default async function DashboardListingsPage({ searchParams }: PageProps) {
  const t = await getTranslations("Dashboard");
  const locale = await getLocale();
  const sp = await searchParams;
  const showShareCta = sp.posted === "1";
  const numberLoc = locale.startsWith("ar") ? "ar-SY" : "en-US";
  const user = await requireSessionUser();

  const origin = getSyriaPublicOrigin();
  const siteLink = origin ? `${origin}/${locale}/buy` : `/${locale}/buy`;
  const shareText = locale.startsWith("ar")
    ? `شارك إعلانك الآن — تصفح العقار على هدية لينك: ${siteLink}`
    : `Share your listing — browse on Hadiah Link: ${siteLink}`;
  const shareWhatsAppHref = buildWhatsAppSendUrl(shareText);

  const listings = await prisma.syriaProperty.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      {showShareCta ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 sm:p-5">
          <p className="text-sm font-semibold text-emerald-950">{t("postShareTitle")}</p>
          <p className="mt-1 text-sm text-emerald-900/90">{t("postShareBody")}</p>
          <div className="mt-4 flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center">
            <a
              href={shareWhatsAppHref}
              target="_blank"
              rel="noreferrer"
              className="hadiah-btn-primary inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold min-[400px]:w-auto"
            >
              {t("postShareWhatsapp")}
            </a>
            <Link
              href="/dashboard/listings"
              className="text-center text-sm font-medium text-emerald-900 underline min-[400px]:text-start"
            >
              {t("postShareDismiss")}
            </Link>
          </div>
        </div>
      ) : null}
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
                <th className="px-4 py-3">{t("tablePlan")}</th>
                <th className="px-4 py-3">{t("tableStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const q = analyzeListingQuality(l);
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
                  <td className="px-4 py-3 text-[color:var(--darlink-text)]">{t(planLabelKey(l.plan))}</td>
                  <td className="px-4 py-3 text-[color:var(--darlink-text)]">{l.status}</td>
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
