import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";

export default async function AdminListingMessagesPage() {
  const t = await getTranslations("Admin");

  const rows = await prisma.listingMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
    include: {
      listing: { select: { id: true, titleAr: true, city: true, adCode: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("listingMessagesTitle")}</h2>
        <p className="text-sm text-stone-600">{t("listingMessagesIntro")}</p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-sm text-stone-500">{t("listingMessagesEmpty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-[880px] w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">{t("listingMessagesColWhen")}</th>
                <th className="px-4 py-3">{t("listingMessagesColListing")}</th>
                <th className="px-4 py-3">{t("listingMessagesColGuest")}</th>
                <th className="px-4 py-3">{t("listingMessagesColPreview")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((r) => {
                const preview = r.message.trim().replace(/\s+/g, " ").slice(0, 160);
                const guestLabel = [r.senderName?.trim(), r.senderPhone?.trim()].filter(Boolean).join(" · ") || "—";
                return (
                  <tr key={r.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-600">
                      {r.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/listing/${r.listing.id}`} className="font-medium text-amber-900 underline-offset-2 hover:underline">
                        {r.listing.adCode} · {r.listing.titleAr.slice(0, 80)}
                        {r.listing.titleAr.length > 80 ? "…" : ""}
                      </Link>
                      <p className="mt-0.5 text-xs text-stone-500">{r.listing.city}</p>
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-sm text-stone-800 [overflow-wrap:anywhere]" dir="auto">
                      {guestLabel}
                    </td>
                    <td className="max-w-md px-4 py-3 text-sm text-stone-700 [overflow-wrap:anywhere]" dir="auto">
                      {preview}
                      {r.message.trim().length > 160 ? "…" : ""}
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
