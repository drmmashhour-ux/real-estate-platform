import { TrainingLabClient } from "@/components/call-center/TrainingLabClient";

export const dynamic = "force-dynamic";

export default async function AdminTrainingLabPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const dashBase = `/${locale}/${country}/dashboard`;

  return <TrainingLabClient adminBase={adminBase} dashBase={dashBase} />;
}
