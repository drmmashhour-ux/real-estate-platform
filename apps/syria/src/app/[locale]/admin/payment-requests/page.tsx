import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { money } from "@/lib/format";
import { pickListingTitle } from "@/lib/listing-localized";
import { adminF1ConfirmFormAction, adminF1RejectFormAction } from "@/actions/payment-f1-admin";

export default async function AdminF1PaymentRequestsPage() {
  const t = await getTranslations("Admin");
  const locale = await getLocale();
  const numberLoc = locale.startsWith("ar") ? "ar-SY" : "en-US";

  const rows = await prisma.syriaPaymentRequest.findMany({
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

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-sm text-stone-500">{t("f1Empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-3">{t("f1ColRequest")}</th>
                <th className="px-3 py-3">{t("f1ColListing")}</th>
                <th className="px-3 py-3">{t("f1ColPlan")}</th>
                <th className="px-3 py-3">{t("f1ColAmount")}</th>
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
                return (
                  <tr key={r.id} className="border-t border-stone-100 align-top">
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
                    <td className="px-3 py-3 text-stone-800">{r.status}</td>
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
