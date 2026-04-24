import { AdminMobileHome } from "@/components/mobile/admin-mobile-home";

export const dynamic = "force-dynamic";

export default async function AdminMobileCommandPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;

  return <AdminMobileHome adminBase={adminBase} />;
}
