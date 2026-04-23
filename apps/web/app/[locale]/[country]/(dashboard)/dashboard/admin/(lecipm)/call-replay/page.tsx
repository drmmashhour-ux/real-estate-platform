import { CallReplayAdminClient } from "@/components/call-replay/CallReplayAdminClient";

export const dynamic = "force-dynamic";

export default async function CallReplayPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const dashBase = `/${locale}/${country}/dashboard`;

  return <CallReplayAdminClient adminBase={adminBase} dashBase={dashBase} />;
}
