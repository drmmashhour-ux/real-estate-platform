import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { SybnbHotelLeadsPanel } from "@/components/admin/SybnbHotelLeadsPanel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("hotelCrmTitle"),
    description: t("hotelCrmSubtitle"),
  };
}

export default async function AdminSybnbHotelsCrmPage() {
  await requireAdmin();
  const t = await getTranslations("Admin");

  const rows = await prisma.sybnbHotelLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const initialLeads = rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    city: r.city,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950 shadow-sm [dir=rtl]:text-right">
        <Link href="/admin/sybnb/hotel-retention" className="font-semibold underline-offset-2 hover:underline">
          {t("hotelRetentionCrmBanner")}
        </Link>
        <span className="text-emerald-900/85"> — {t("hotelRetentionCrmBannerHint")}</span>
      </div>
      <SybnbHotelLeadsPanel initialLeads={initialLeads} />
    </div>
  );
}
