import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { setFeaturedPlacementActive } from "@/actions/admin";

export default async function AdminPromotionsPage() {
  const t = await getTranslations("Admin");

  const placements = await prisma.syriaFeaturedPlacement.findMany({
    include: { property: true },
    orderBy: [{ active: "desc" }, { startsAt: "desc" }],
    take: 120,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("promotionsTitle")}</h2>
        <p className="text-sm text-stone-600">{t("promotionsIntro")}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">{t("promotionsColListing")}</th>
              <th className="px-4 py-3">{t("promotionsColZone")}</th>
              <th className="px-4 py-3">{t("promotionsColPriority")}</th>
              <th className="px-4 py-3">{t("promotionsColWindow")}</th>
              <th className="px-4 py-3">{t("promotionsColPayment")}</th>
              <th className="px-4 py-3">{t("tableStatus")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {placements.map((pl) => (
              <tr key={pl.id} className="border-t border-stone-100 align-top">
                <td className="px-4 py-3">
                  <span className="font-medium">{pl.property.titleAr}</span>
                  <p className="text-xs text-stone-500">{pl.property.city}</p>
                </td>
                <td className="px-4 py-3">{pl.zone}</td>
                <td className="px-4 py-3">{pl.priority}</td>
                <td className="px-4 py-3 text-xs">
                  {pl.startsAt.toISOString().slice(0, 10)}
                  {pl.endsAt ? ` → ${pl.endsAt.toISOString().slice(0, 10)}` : ""}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{pl.linkedListingPaymentId ?? "—"}</td>
                <td className="px-4 py-3">{pl.active ? t("promotionsActive") : t("promotionsInactive")}</td>
                <td className="px-4 py-3">
                  <form action={setFeaturedPlacementActive} className="inline">
                    <input type="hidden" name="placementId" value={pl.id} />
                    <input type="hidden" name="active" value={pl.active ? "false" : "true"} />
                    <button type="submit" className="text-xs font-semibold text-amber-900 hover:underline">
                      {pl.active ? t("promotionsDeactivate") : t("promotionsActivate")}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
