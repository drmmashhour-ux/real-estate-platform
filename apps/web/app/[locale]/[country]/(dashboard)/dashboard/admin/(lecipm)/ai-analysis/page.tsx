import { AdminAiAnalysisLuxuryClient } from "@/components/dashboard/AdminAiAnalysisLuxuryClient";

export const dynamic = "force-dynamic";

export default async function AdminAiAnalysisCenterPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const dashBase = `/${locale}/${country}/dashboard`;

  return <AdminAiAnalysisLuxuryClient adminBase={adminBase} dashBase={dashBase} />;
}
