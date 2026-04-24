import { MarketDominationDashboardClient } from "@/modules/market-domination/components/MarketDominationDashboardClient";

export const dynamic = "force-dynamic";

export default async function MarketDominationPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;

  return (
    <div className="min-h-screen bg-zinc-950">
      <MarketDominationDashboardClient adminBase={adminBase} />
    </div>
  );
}
