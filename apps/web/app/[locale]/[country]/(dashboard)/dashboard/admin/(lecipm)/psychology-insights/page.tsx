import { PsychologyInsightsClient } from "@/components/sales-psychology/PsychologyInsightsClient";

export const dynamic = "force-dynamic";

export default async function PsychologyInsightsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const dashBase = `/${locale}/${country}/dashboard`;

  return <PsychologyInsightsClient adminBase={adminBase} dashBase={dashBase} />;
}
