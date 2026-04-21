import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { PipelineDealsDashboard } from "@/components/deals/PipelineDealsDashboard";

export const dynamic = "force-dynamic";

export default async function InvestmentDealsHubPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const { locale, country } = await params;
  const prefix = `/${locale}/${country}`;

  return (
    <PipelineDealsDashboard localePrefix={prefix} dealDetailHref={`${prefix}/dashboard/deals`} />
  );
}
