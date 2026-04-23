import { AiSalesManagerUserClient } from "@/components/ai-sales-manager/AiSalesManagerUserClient";

export const dynamic = "force-dynamic";

export default async function AiSalesManagerUserPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; userId: string }>;
}) {
  const { locale, country, userId } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const decoded = decodeURIComponent(userId);

  return <AiSalesManagerUserClient userId={decoded} adminBase={adminBase} />;
}
