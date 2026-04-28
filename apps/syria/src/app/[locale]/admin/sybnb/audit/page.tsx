import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";

/** Append-only SYBNB booking lifecycle audit (IDs & statuses only). Admin shell enforces access. */
export default async function AdminSybnbAuditPage() {
  const t = await getTranslations("Admin");

  const rows = await prisma.sybnbAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      action: true,
      bookingId: true,
      actorRole: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("sybnbAuditTitle")}</h2>
        <p className="text-sm text-stone-600">{t("sybnbAuditIntro")}</p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-stone-200 bg-white px-5 py-10 text-center text-sm text-stone-500">{t("sybnbAuditEmpty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-900">{t("sybnbAuditColWhen")}</th>
                <th className="px-4 py-3 font-semibold text-stone-900">{t("sybnbAuditColAction")}</th>
                <th className="px-4 py-3 font-semibold text-stone-900">{t("sybnbAuditColBooking")}</th>
                <th className="px-4 py-3 font-semibold text-stone-900">{t("sybnbAuditColRole")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-stone-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-stone-700">{r.createdAt.toISOString()}</td>
                  <td className="px-4 py-2.5 text-stone-900">{r.action}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-stone-700">{r.bookingId ?? "—"}</td>
                  <td className="px-4 py-2.5 text-stone-800">{r.actorRole ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
