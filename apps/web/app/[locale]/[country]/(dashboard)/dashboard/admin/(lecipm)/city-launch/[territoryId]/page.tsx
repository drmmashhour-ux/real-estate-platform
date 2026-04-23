import { CityLaunchTerritoryClient } from "@/modules/city-launch/components/CityLaunchTerritoryClient";

export const dynamic = "force-dynamic";

export default async function CityLaunchTerritoryPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; territoryId: string }>;
}) {
  const { locale, country, territoryId } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const decodedId = decodeURIComponent(territoryId);

  return (
    <div className="min-h-screen bg-zinc-950">
      <CityLaunchTerritoryClient territoryId={decodedId} adminBase={adminBase} />
    </div>
  );
}
