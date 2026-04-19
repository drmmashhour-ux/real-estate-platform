import Link from "next/link";
import { BrokerTeamBrokerDetail } from "@/components/broker/BrokerTeamBrokerDetail";
import { brokerTeamViewFlags, brokerTeamViewPanelFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBrokerTeamDetailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; brokerId: string }>;
}) {
  const { locale, country, brokerId } = await params;
  const pathPrefix = `/${locale}/${country}`;

  if (!brokerTeamViewFlags.brokerTeamViewV1 || !brokerTeamViewPanelFlags.brokerTeamViewPanelV1) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-slate-400">
        <p className="text-white">Broker team coaching is disabled.</p>
        <p className="mt-2">
          Enable <code className="rounded bg-white/10 px-1 py-0.5 text-xs">FEATURE_BROKER_TEAM_VIEW_V1</code> and{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-xs">FEATURE_BROKER_TEAM_VIEW_PANEL_V1</code>.
        </p>
        <div className="mt-6">
          <Link href={`${pathPrefix}/admin`} className="text-sky-300 hover:underline">
            ← Admin home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-white">
      <div className="mb-6 text-xs">
        <Link href={`${pathPrefix}/admin/broker-team`} className="text-sky-300 hover:underline">
          ← Back to team coaching
        </Link>
      </div>
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Broker coaching snapshot</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Manager read-only view — pipeline and scores come from CRM telemetry; use for private 1:1 conversations.
        </p>
      </header>
      <div className="mt-8">
        <BrokerTeamBrokerDetail brokerId={brokerId} pathPrefix={pathPrefix} />
      </div>
    </div>
  );
}
