import { BrokerTeamDashboard } from "@/components/broker/BrokerTeamDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBrokerTeamPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const pathPrefix = `/${locale}/${country}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Broker team coaching</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Internal visibility for managers — spot who may need support, celebrate momentum, and reduce pipeline risk
          without public rankings or automated enforcement.
        </p>
      </header>
      <div className="mt-8">
        <BrokerTeamDashboard pathPrefix={pathPrefix} />
      </div>
    </div>
  );
}
