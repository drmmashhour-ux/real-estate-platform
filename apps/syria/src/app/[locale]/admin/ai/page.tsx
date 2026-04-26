import { getTranslations } from "next-intl/server";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";

export default async function AdminAiPage() {
  const t = await getTranslations("AdminAi");

  const published = { status: "PUBLISHED" as const, fraudFlag: false };

  const [total, noPhotos, noAmenities, lowTitle, withAnyImage, withAmenities] = await Promise.all([
    prisma.syriaProperty.count({ where: published }),
    prisma.syriaProperty.count({
      where: { ...published, images: { equals: [] } },
    }),
    prisma.syriaProperty.count({
      where: { ...published, amenities: { equals: [] } },
    }),
    prisma.$queryRaw<[{ c: bigint }]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS c
      FROM syria_properties
      WHERE status = 'PUBLISHED' AND fraud_flag = false
        AND char_length(trim(COALESCE(title_ar, ''))) < 8
    `),
    prisma.syriaProperty.count({
      where: { ...published, NOT: { images: { equals: [] } } },
    }),
    prisma.syriaProperty.count({
      where: { ...published, NOT: { amenities: { equals: [] } } },
    }),
  ]);

  const lowQuality = Number(lowTitle[0]?.c ?? 0);
  const recs = [
    t("recMorePhotos"),
    t("recAmenities"),
    t("recTitle"),
    t("recQuickPost"),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-stone-500">{t("kpiTotal")}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-stone-900">{total}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-stone-500">{t("kpiNoPhotos")}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-amber-800">{noPhotos}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-stone-500">{t("kpiNoAmenities")}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-amber-800">{noAmenities}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-stone-500">{t("kpiLowQuality")}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-red-800">{lowQuality}</p>
          <p className="mt-1 text-xs text-stone-500">{t("kpiLowQualityHint")}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-stone-500">{t("kpiWithPhotos")}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-800">{withAnyImage}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-stone-500">{t("kpiWithAmenities")}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-800">{withAmenities}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("recommendationsTitle")}</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-stone-700">
          {recs.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
