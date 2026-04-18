import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { money } from "@/lib/format";

export default async function DashboardPaymentsPage() {
  const t = await getTranslations("Dashboard");
  const user = await requireSessionUser();

  const payments = await prisma.syriaListingPayment.findMany({
    where: { ownerId: user.id },
    include: { property: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-900">{t("paymentsTitle")}</h2>
      <p className="text-sm text-stone-600">{t("paymentsIntro")}</p>
      {payments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-sm text-stone-600">
          {t("paymentsEmpty")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">{t("tableProperty")}</th>
                <th className="px-4 py-3">{t("tablePurpose")}</th>
                <th className="px-4 py-3">{t("tableAmount")}</th>
                <th className="px-4 py-3">{t("tablePaymentStatus")}</th>
                <th className="px-4 py-3">{t("tableRef")}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-medium text-stone-900">{p.property.title}</td>
                  <td className="px-4 py-3 text-stone-700">{p.purpose}</td>
                  <td className="px-4 py-3">{money(p.amount, p.currency)}</td>
                  <td className="px-4 py-3 text-stone-700">{p.status}</td>
                  <td className="px-4 py-3 text-xs text-stone-600">{p.referenceNumber ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
