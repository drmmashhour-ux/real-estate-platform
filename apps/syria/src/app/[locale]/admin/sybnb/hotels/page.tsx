import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

  return <SybnbHotelLeadsPanel initialLeads={initialLeads} />;
}
