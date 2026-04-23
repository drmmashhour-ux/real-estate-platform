import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import {
  approveProperty,
  rejectProperty,
  verifyListingPayment,
  setPropertyFraudFlag,
} from "@/actions/admin";
import { getDarlinkAutonomyFlags } from "@/lib/platform-flags";
import { money } from "@/lib/format";

export default async function AdminListingsPage() {
  const t = await getTranslations("Admin");

  const properties = await prisma.syriaProperty.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: true,
      listingPayments: true,
    },
    take: 80,
  });

  const autonomyQuickLink = getDarlinkAutonomyFlags().AUTONOMY_ENABLED ?
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-950">
      <Link href="/admin/autonomy" className="font-semibold underline underline-offset-2 hover:text-indigo-900">
        Marketplace autonomy dashboard
      </Link>
      <p className="mt-2 text-xs text-indigo-900/80">
        Signals, opportunities, approvals, and dry-run controls live on the autonomy admin page.
      </p>
    </div>
  : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("listingsTitle")}</h2>
        <p className="text-sm text-stone-600">{t("listingsIntro")}</p>
      </div>

      {autonomyQuickLink}
      <div className="space-y-6">
        {properties.map((p) => (
          <article key={p.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-stone-500">{p.type}</p>
                <h3 className="text-lg font-semibold text-stone-900">{p.titleAr}</h3>
                {p.titleEn ? (
                  <p className="text-xs text-stone-500 ltr:text-left rtl:text-right" dir="ltr">
                    {p.titleEn}
                  </p>
                ) : null}
                <p className="text-sm text-stone-600">{t("listingOwnerCity", { city: p.city, email: p.owner.email })}</p>
                <p className="mt-2 font-medium">{money(p.price, p.currency)}</p>
                <p className="text-sm text-stone-700">
                  {t("listingStatusPrefix")}: <strong>{p.status}</strong>
                  {p.fraudFlag ? (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-900">
                      {t("fraudBadge")}
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={approveProperty}>
                  <input type="hidden" name="propertyId" value={p.id} />
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    {t("approve")}
                  </button>
                </form>
                <form action={rejectProperty}>
                  <input type="hidden" name="propertyId" value={p.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-100"
                  >
                    {t("reject")}
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <form action={setPropertyFraudFlag} className="flex flex-wrap items-center gap-2 rounded-xl bg-stone-50 p-3">
                <input type="hidden" name="propertyId" value={p.id} />
                <input type="hidden" name="fraud" value={p.fraudFlag ? "false" : "true"} />
                <button type="submit" className="text-xs font-semibold text-red-800 hover:underline">
                  {p.fraudFlag ? t("clearFraud") : t("flagFraud")}
                </button>
              </form>
              <Link href={`/listing/${p.id}`} className="text-sm font-medium text-[color:var(--color-syria-olive)] hover:underline">
                {t("viewPublic")}
              </Link>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-stone-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="px-3 py-2">{t("tablePurpose")}</th>
                    <th className="px-3 py-2">{t("tableAmount")}</th>
                    <th className="px-3 py-2">{t("tableStatus")}</th>
                    <th className="px-3 py-2">{t("tableReference")}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {p.listingPayments.map((pay) => (
                    <tr key={pay.id} className="border-t border-stone-100">
                      <td className="px-3 py-2">{pay.purpose}</td>
                      <td className="px-3 py-2">{money(pay.amount, pay.currency)}</td>
                      <td className="px-3 py-2">{pay.status}</td>
                      <td className="px-3 py-2 text-stone-600">{pay.referenceNumber ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {pay.status !== "VERIFIED" ? (
                          <form action={verifyListingPayment} className="inline">
                            <input type="hidden" name="paymentId" value={pay.id} />
                            <button type="submit" className="text-xs font-semibold text-emerald-800 hover:underline">
                              {t("verify")}
                            </button>
                          </form>
                        ) : (
                          <span className="text-stone-400">{t("verified")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
