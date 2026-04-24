import { AdminSoinsLuxuryClient } from "@/components/dashboard/AdminSoinsLuxuryClient";
import { getSoinsAdminOverviewVm } from "@/modules/soins/soins-admin.service";

export const dynamic = "force-dynamic";

export default async function AdminSoinsHubPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const data = await getSoinsAdminOverviewVm();

  const catalogHref = `/${locale}/${country}/soins`;

  return (
    <AdminSoinsLuxuryClient
      adminBase={adminBase}
      catalogHref={catalogHref}
      residents={data.residents}
      recentEvents={data.recentEvents}
      residenceCount={data.residenceCount}
    />
  );
}
