import { CityLaunchDashboardClient } from "@/modules/city-launch/components/CityLaunchDashboardClient";

export const dynamic = "force-dynamic";

export default async function CityLaunchPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;

  return (
    <div className="min-h-screen bg-zinc-950">
      <CityLaunchDashboardClient adminBase={adminBase} />
    </div>
  );
}
