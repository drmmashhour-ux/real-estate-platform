import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { pickListingTitle } from "@/lib/listing-localized";
import { analyzeListingQuality } from "@/lib/listing-quality";

export default async function DashboardListingsPage() {
  const t = await getTranslations("Dashboard");
  const locale = await getLocale();
  const numberLoc = locale.startsWith("ar") ? "ar-SY" : "en-US";
  const user = await requireSessionUser();

  const listings = await prisma.syriaProperty.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--darlink-text)]">{t("listingsTitle")}</h2>
          <p className="text-sm text-[color:var(--darlink-text-muted)]">{t("listingsSubtitle")}</p>
        </div>
        <Link
          href="/sell"
          className="rounded-[var(--darlink-radius-xl)] bg-[color:var(--darlink-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-[0.96]"
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
