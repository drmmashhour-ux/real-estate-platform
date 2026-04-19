import { BrokerIncentivesAdminPanel } from "@/components/broker/BrokerIncentivesAdminPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminBrokerIncentivesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-white">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Broker incentives (observability)</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Lightweight signals from CRM touches — use for wellness checks and coaching outreach. Not rankings for blame,
          not compensation.
        </p>
      </header>
      <div className="mt-8">
        <BrokerIncentivesAdminPanel />
      </div>
    </div>
  );
}
