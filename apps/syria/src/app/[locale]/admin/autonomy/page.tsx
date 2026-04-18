import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { regenerateAutonomyRecommendations, resolveAutonomyRecommendation } from "@/actions/admin";
import { getSyriaAutonomyMode, syriaPlatformConfig } from "@/config/syria-platform.config";

export default async function AdminAutonomyPage() {
  const t = await getTranslations("Admin");

  const rows = await prisma.syriaAutonomyRecommendation.findMany({
    include: { property: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("autonomyTitle")}</h2>
        <p className="text-sm text-stone-600">{t("autonomyIntro")}</p>
        <ul className="mt-3 list-inside list-disc text-xs text-stone-600">
          <li>{t("autonomyModeLabel", { mode: getSyriaAutonomyMode() })}</li>
          <li>{t("autonomyExternalMessaging", { allowed: syriaPlatformConfig.communications.externalMessagingAllowed })}</li>
          <li>{t("autonomyAutoPayout", { enabled: syriaPlatformConfig.payouts.autoPayoutEnabled })}</li>
        </ul>
        <p className="mt-3 text-xs text-stone-500">{t("autonomyPreviewHint")}</p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">{t("autonomyGenerateTitle")}</h3>
        <form action={regenerateAutonomyRecommendations} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block text-sm text-stone-700">
            {t("autonomyPropertyId")}
            <input
              name="propertyId"
              required
              placeholder="cuid…"
              className="mt-1 block w-full min-w-[240px] rounded-lg border border-stone-200 px-3 py-2 font-mono text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            {t("autonomyGenerateCta")}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">{t("autonomyColWhen")}</th>
              <th className="px-4 py-3">{t("autonomyColAction")}</th>
              <th className="px-4 py-3">{t("autonomyColListing")}</th>
              <th className="px-4 py-3">{t("autonomyColMode")}</th>
              <th className="px-4 py-3">{t("tableStatus")}</th>
              <th className="px-4 py-3">{t("autonomyColExplain")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-stone-100 align-top">
                <td className="px-4 py-3 text-xs text-stone-600">{r.createdAt.toISOString().slice(0, 16)}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.actionType}</td>
                <td className="px-4 py-3 text-xs">
                  {r.property ? (
                    <>
                      <span className="font-medium">{r.property.titleAr}</span>
                      <p className="text-stone-500">{r.property.city}</p>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-xs">{r.autonomyMode}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3 text-xs text-stone-700">{r.explanation ?? "—"}</td>
                <td className="px-4 py-3">
                  {r.status === "PENDING" ? (
                    <div className="flex flex-col gap-2">
                      <form action={resolveAutonomyRecommendation}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="ACKNOWLEDGED" />
                        <button type="submit" className="text-xs font-semibold text-emerald-800 hover:underline">
                          {t("autonomyAck")}
                        </button>
                      </form>
                      <form action={resolveAutonomyRecommendation}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="DISMISSED" />
                        <button type="submit" className="text-xs font-semibold text-stone-600 hover:underline">
                          {t("autonomyDismiss")}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-xs text-stone-400">—</span>
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
