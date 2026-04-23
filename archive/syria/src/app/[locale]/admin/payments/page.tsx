import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { verifyListingPayment } from "@/actions/admin";
import { money } from "@/lib/format";

export default async function AdminPaymentsPage() {
  const t = await getTranslations("Admin");

  const payments = await prisma.syriaListingPayment.findMany({
    include: {
      property: true,
      owner: true,
      reviewedBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("paymentsTitle")}</h2>
        <p className="text-sm text-stone-600">{t("paymentsIntro")}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">{t("paymentsColProperty")}</th>
              <th className="px-4 py-3">{t("paymentsColOwner")}</th>
              <th className="px-4 py-3">{t("tablePurpose")}</th>
              <th className="px-4 py-3">{t("paymentsColMethod")}</th>
              <th className="px-4 py-3">{t("tableAmount")}</th>
              <th className="px-4 py-3">{t("tableStatus")}</th>
              <th className="px-4 py-3">{t("paymentsColReviewer")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-stone-100 align-top">
                <td className="px-4 py-3">
                  <span className="font-medium">{p.property.titleAr}</span>
                  <p className="text-xs text-stone-500">{p.property.city}</p>
                </td>
                <td className="px-4 py-3 text-xs">{p.owner.email}</td>
                <td className="px-4 py-3">{p.purpose}</td>
                <td className="px-4 py-3 text-xs">{p.paymentMethod}</td>
                <td className="px-4 py-3">{money(p.amount, p.currency)}</td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3 text-xs">{p.reviewedBy?.email ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {p.status !== "VERIFIED" ? (
                    <form action={verifyListingPayment} className="inline">
                      <input type="hidden" name="paymentId" value={p.id} />
                      <button type="submit" className="text-xs font-semibold text-emerald-800 hover:underline">
                        {t("verify")}
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-stone-400">{t("verified")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
