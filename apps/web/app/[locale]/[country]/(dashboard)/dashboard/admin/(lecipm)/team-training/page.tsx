import { TeamTrainingCoachClient } from "@/components/team-training/TeamTrainingCoachClient";

export const dynamic = "force-dynamic";

export default async function TeamTrainingPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const dashBase = `/${locale}/${country}/dashboard`;

  return <TeamTrainingCoachClient adminBase={adminBase} dashBase={dashBase} />;
}
