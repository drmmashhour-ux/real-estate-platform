import { TrainingLiveClient } from "@/components/live-training/TrainingLiveClient";

export const dynamic = "force-dynamic";

export default async function AdminTrainingLivePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const dashBase = `/${locale}/${country}/dashboard`;

  return <TrainingLiveClient adminBase={adminBase} dashBase={dashBase} />;
}
