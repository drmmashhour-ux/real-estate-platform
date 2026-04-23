import { AutonomousMarketingEngineClient } from "@/components/marketing/AutonomousMarketingEngineClient";

export const dynamic = "force-dynamic";

export default async function AutonomousMarketingEnginePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const marketingHubHref = `/${locale}/${country}/dashboard/marketing`;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <AutonomousMarketingEngineClient adminBase={adminBase} marketingHubHref={marketingHubHref} />
    </div>
  );
}
