import { GlobalExpansionDashboardClient } from "@/modules/global-expansion/components/GlobalExpansionDashboardClient";

export const dynamic = "force-dynamic";

export default async function GlobalExpansionPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;

  return (
    <div className="min-h-screen bg-zinc-950">
      <GlobalExpansionDashboardClient adminBase={adminBase} />
    </div>
  );
}
