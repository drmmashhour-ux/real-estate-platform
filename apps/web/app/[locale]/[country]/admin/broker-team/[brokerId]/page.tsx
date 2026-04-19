import Link from "next/link";
import { BrokerTeamBrokerDetail } from "@/components/broker/BrokerTeamBrokerDetail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBrokerTeamDetailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; brokerId: string }>;
}) {
  const { locale, country, brokerId } = await params;
  const pathPrefix = `/${locale}/${country}`;

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
