import { BrokerPerformanceAdminPanel } from "@/components/broker/BrokerPerformanceAdminPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminBrokerExecutionPerformancePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Broker execution performance</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Internal leaderboard and cohort signals derived from CRM progression and follow-up telemetry. Use for coaching
          and routing — not for public ranking or guaranteed quality labels.
        </p>
      </header>
      <div className="mt-8">
        <BrokerPerformanceAdminPanel />
      </div>
    </div>
  );
}
