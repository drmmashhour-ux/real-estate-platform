import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { pickListingTitle } from "@/lib/listing-localized";
import {
  adminArchiveSybnbListing,
  adminKeepSybnbListingActive,
  markAllSybnbReportsReviewedForListing,
  markSybnbReportReviewed,
} from "@/actions/sybnb-admin";
import { SY8_REPORT_REASONS } from "@/lib/sy8/sy8-constants";

type ReportRow = Awaited<ReturnType<typeof loadReports>>[number];

type Group = {
  propertyId: string;
  property: { titleAr: string; titleEn: string | null; id: string };
  owner: { email: string; name: string | null };
  reports: ReportRow[];
  reasonCounts: Record<string, number>;
};

async function loadReports() {
  return prisma.listingReport.findMany({
    include: { listing: { include: { owner: { select: { email: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 600,
  });
}

function groupReports(rows: Awaited<ReturnType<typeof loadReports>>): Group[] {
  const map = new Map<string, Group>();
  for (const r of rows) {
    const g = map.get(r.listingId);
    const nextReason = (counts: Record<string, number>, reason: string) => ({
      ...counts,
      [reason]: (counts[reason] ?? 0) + 1,
    });
    if (!g) {
      map.set(r.listingId, {
        propertyId: r.listingId,
        property: {
          id: r.listing.id,
          titleAr: r.listing.titleAr,
          titleEn: r.listing.titleEn,
        },
        owner: { email: r.listing.owner.email, name: r.listing.owner.name },
        reports: [r],
        reasonCounts: nextReason({}, r.reason),
      });
    } else {
      g.reports.push(r);
      g.reasonCounts = nextReason(g.reasonCounts, r.reason);
    }
  }
  return [...map.values()].sort((a, b) => b.reports.length - a.reports.length);
}

function reasonLabel(t8: (k: string) => string, key: string): string {
  return (SY8_REPORT_REASONS as readonly string[]).includes(key) ? t8(`report_${key}`) : key;
}

export default async function AdminSybnbReportsPage() {
  const t = await getTranslations("Admin");
  const t8 = await getTranslations("Sy8");
  const locale = await getLocale();
  const rows = await loadReports();
  const groups = groupReports(rows);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("sybnbReportsTitle")}</h2>
        <p className="text-sm text-stone-600">{t("sybnbReportsIntro")}</p>
      </div>
      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-6 py-10 text-sm text-stone-600">
          {t("sybnbNoReports")}
        </p>
      ) : (
        <ul className="space-y-6">
          {groups.map((g) => {
            const open = g.reports.filter((r) => !r.reviewed).length;
            return (
              <li
                key={g.propertyId}
                className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      href={`/sybnb/listings/${g.propertyId}`}
                      className="text-lg font-semibold text-stone-900 hover:underline"
                    >
                      {pickListingTitle(
                        { titleAr: g.property.titleAr, titleEn: g.property.titleEn },
                        locale,
                      )}
                    </Link>
                    <p className="text-sm text-stone-600">
                      {t("sybnbReportGroupMeta", { reports: g.reports.length, open })}
                    </p>
                    <p className="mt-1 text-xs text-stone-500" dir="auto">
                      {t("sybnbSeller")}: {g.owner.name ? `${g.owner.name} · ` : null}
                      {g.owner.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={markAllSybnbReportsReviewedForListing}>
                      <input type="hidden" name="propertyId" value={g.propertyId} />
                      <button
                        type="submit"
                        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100"
                      >
                        {t("sybnbMarkAllReviewed")}
                      </button>
                    </form>
                    <form action={adminKeepSybnbListingActive}>
                      <input type="hidden" name="propertyId" value={g.propertyId} />
                      <button
                        type="submit"
                        className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100"
                      >
                        {t("sybnbKeepActive")}
                      </button>
                    </form>
                    <form action={adminArchiveSybnbListing}>
                      <input type="hidden" name="propertyId" value={g.propertyId} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-100"
                      >
                        {t("sybnbArchiveListing")}
                      </button>
                    </form>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{t("sybnbReasonCounts")}</p>
                  <ul className="mt-1 flex flex-wrap gap-2 text-xs text-stone-700">
                    {Object.entries(g.reasonCounts).map(([k, v]) => (
                      <li key={k} className="rounded-full bg-stone-100 px-2 py-0.5" dir="auto">
                        {reasonLabel(t8, k)}: {v}
                      </li>
                    ))}
                  </ul>
                </div>

                <ul className="divide-y divide-stone-100 rounded-xl border border-stone-100">
                  {g.reports.map((r) => (
                    <li key={r.id} className="flex flex-col gap-2 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-stone-800" dir="auto">
                          <span className="font-medium">{reasonLabel(t8, r.reason)}</span>{" "}
                          {r.reviewed ? <span className="text-xs text-emerald-700">(reviewed)</span> : null}
                        </p>
                        <p className="text-xs text-stone-500">
                          {t("sybnbReportWhen")}: {r.createdAt.toISOString().slice(0, 10)}
                        </p>
                      </div>
                      {!r.reviewed ? (
                        <form action={markSybnbReportReviewed}>
                          <input type="hidden" name="reportId" value={r.id} />
                          <button
                            type="submit"
                            className="rounded-md bg-stone-900 px-2 py-1 text-xs font-semibold text-amber-300 hover:bg-stone-800"
                          >
                            {t("sybnbMarkReportReviewed")}
                          </button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
