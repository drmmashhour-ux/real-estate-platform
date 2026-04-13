import { getGrowthDashboardData } from "@/src/modules/dashboard/getGrowthDashboardData";
import { GrowthDashboardClient } from "@/src/modules/dashboard/GrowthDashboardClient";

/**
 * Admin growth funnel dashboard (user_events + CRM + revenue rollups).
 * Lives under App Router to avoid a conflicting `src/pages` tree next to `app/`.
 */
export default async function GrowthEngineAdminDashboard() {
  const data = await getGrowthDashboardData();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 border-b border-slate-800 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">Growth engine</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-white">Funnel & revenue</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Analytics (`user_events`), leads, bookings, and paid platform volume (30d). Data since{" "}
          {data.since.slice(0, 10)}.
        </p>
      </header>
      <GrowthDashboardClient
        totals={data.totals}
        funnel={data.funnel}
        rates={data.rates}
        series={data.series}
      />
    </main>
  );
}
