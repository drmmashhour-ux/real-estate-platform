import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { money } from "@/lib/format";
import { pickListingTitle } from "@/lib/listing-localized";
import { adminF1ConfirmFormAction, adminF1RejectFormAction } from "@/actions/payment-f1-admin";
import { AdminF1Tabs, type AdminF1Filter } from "@/components/admin/AdminF1Tabs";
import { F1M2ClosingSection } from "@/components/admin/F1M2ClosingSection";
import { getF1DailyClosingStats } from "@/lib/monetization-f1-daily-stats";
import type { Prisma } from "@/generated/prisma";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function buildF1Where(
  filter: AdminF1Filter,
): { where: Prisma.SyriaPaymentRequestWhereInput; tab: AdminF1Filter } {
  if (filter === "stats") {
    return { where: {}, tab: "all" };
  }
  if (filter === "pending") {
    return { where: { status: "pending" }, tab: "pending" };
  }
  if (filter === "active") {
    return { where: { status: "confirmed" }, tab: "active" };
  }
  if (filter === "archived") {
    return { where: { status: "rejected" }, tab: "archived" };
  }
  if (filter === "expired") {
    const stale = new Date();
    stale.setDate(stale.getDate() - 14);
    return {
      where: { status: "pending", createdAt: { lt: stale } },
      tab: "expired",
    };
  }
  return { where: {}, tab: "all" };
}

export default async function AdminF1PaymentRequestsPage({ searchParams }: PageProps) {
  const t = await getTranslations("Admin");
  const locale = await getLocale();
  const numberLoc = locale.startsWith("ar") ? "ar-SY" : "en-US";
  const sp = await searchParams;
  const raw = typeof sp.filter === "string" ? sp.filter : "all";
  const filter: AdminF1Filter =
    raw === "pending" || raw === "followup" || raw === "active" || raw === "expired" || raw === "archived"
      ? raw
      : "all";
  const { where } = buildF1Where(filter);
  const daily = await getF1DailyClosingStats();

  const rows = await prisma.syriaPaymentRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { listing: { select: { id: true, titleAr: true, titleEn: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("f1RequestsTitle")}</h2>
        <p className="mt-1 text-sm text-stone-600">{t("f1RequestsIntro")}</p>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-stone-900">{t("f1M2DailyLogTitle")}</h3>
        <p className="mt-0.5 text-xs text-stone-500">{t("f1M2DailyLogHint")}</p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-stone-50 px-3 py-2">
            <dt className="text-xs font-medium text-stone-500">{t("f1M2StatPending")}</dt>
            <dd className="text-lg font-bold tabular-nums text-stone-900">{daily.pendingCount}</dd>
          </div>
          <div className="rounded-xl bg-stone-50 px-3 py-2">
            <dt className="text-xs font-medium text-stone-500">{t("f1M2StatRequestsToday")}</dt>
            <dd className="text-lg font-bold tabular-nums text-stone-900">{daily.requestsCreatedToday}</dd>
          </div>
          <div className="rounded-xl bg-stone-50 px-3 py-2">
            <dt className="text-xs font-medium text-stone-500">{t("f1M2StatPaymentsToday")}</dt>
            <dd className="text-lg font-bold tabular-nums text-stone-900">{daily.paymentsConfirmedToday}</dd>
          </div>
          <div className="rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200/80">
            <dt className="text-xs font-medium text-amber-900/80">{t("f1M2StatRevenueToday")}</dt>
            <dd className="text-lg font-bold tabular-nums text-amber-950">
              {money(daily.revenueSypToday, "SYP", numberLoc)}
            </dd>
          </div>
        </dl>
      </section>

      <F1M2ClosingSection />

      <AdminF1Tabs current={filter} t={t} />

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-sm text-stone-500">
          {filter === "all" ? t("f1Empty") : t("f1FilterEmpty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-3">{t("f1ColRequest")}</th>
                <th className="px-3 py-3">{t("f1ColListing")}</th>
                <th className="px-3 py-3">{t("f1ColPlan")}</th>
                <th className="px-3 py-3">{t("f1ColAmount")}</th>
                <th className="px-3 py-3">{t("f1ColTier")}</th>
                <th className="px-3 py-3">{t("f1ColStatus")}</th>
                <th className="px-3 py-3">{t("f1ColCreated")}</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const listing = r.listing;
                const title = listing ? pickListingTitle(listing, locale) : "—";
                const pending = r.status === "pending";
                const ageMs = Date.now() - r.createdAt.getTime();
                const needsFollowup = pending && ageMs >= 12 * 60 * 60 * 1000;
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-stone-100 align-top ${needsFollowup ? "bg-amber-50/80" : ""}`}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-stone-700">{r.id}</td>
                    <td className="px-3 py-3">
                      {listing ? (
                        <div>
                          <span className="font-medium text-stone-900">{title}</span>
                          <p className="mt-1">
                            <Link href={`/listing/${listing.id}`} className="text-xs text-emerald-800 underline">
                              {t("f1OpenListing")}
                            </Link>
                          </p>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 text-stone-800">{r.plan}</td>
                    <td className="px-3 py-3 tabular-nums">{money(r.amount, r.currency, numberLoc)}</td>
                    <td className="px-3 py-3 tabular-nums text-stone-700" dir="ltr">
                      {r.pricingTier}
                    </td>
                    <td className="px-3 py-3 text-stone-800">
                      <span className="inline-flex flex-col gap-1">
                        <span>{r.status}</span>
                        {needsFollowup ? (
                          <span className="w-fit rounded-full bg-amber-200/90 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                            {t("f1M2FollowupBadge")}
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-stone-500">
                      {r.createdAt.toLocaleString(locale.startsWith("ar") ? "ar-SY" : "en-GB", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-3 py-3">
                      {pending ? (
                        <div className="flex min-w-[200px] flex-col gap-2">
                          <form action={adminF1ConfirmFormAction}>
                            <input type="hidden" name="requestId" value={r.id} />
                            <button
                              type="submit"
                              className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                            >
                              {t("f1Confirm")}
                            </button>
                          </form>
                          <form action={adminF1RejectFormAction} className="space-y-1">
                            <input type="hidden" name="requestId" value={r.id} />
                            <input
                              name="reason"
                              placeholder={t("f1RejectReason")}
                              className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs"
                            />
                            <button
                              type="submit"
                              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50"
                            >
                              {t("f1Reject")}
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
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
