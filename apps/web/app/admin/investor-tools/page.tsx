import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminInvestorToolsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/admin/investor-tools");
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/");

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [events, profiles, scenarios, leads] = await Promise.all([
    prisma.toolUsageEvent.findMany({
      where: { toolKey: "investor_portfolio", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.investorProfile.findMany({ orderBy: { updatedAt: "desc" }, take: 50 }),
    prisma.portfolioScenario.findMany({ orderBy: { updatedAt: "desc" }, take: 50 }),
    prisma.lead.findMany({
      where: { leadSource: "investor_portfolio_lead" },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const byEvent = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.eventType] = (acc[e.eventType] ?? 0) + 1;
    return acc;
  }, {});

  const cityTally: Record<string, number> = {};
  for (const p of profiles) {
    for (const c of p.targetCities) {
      cityTally[c] = (cityTally[c] ?? 0) + 1;
    }
  }
  const topCities = Object.entries(cityTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const strategyTally: Record<string, number> = {};
  for (const p of profiles) {
    if (p.strategy) strategyTally[p.strategy] = (strategyTally[p.strategy] ?? 0) + 1;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-amber-400">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Investor portfolio tools — usage</h1>
        <p className="mt-2 text-sm text-slate-400">Last 30 days (tool_usage_events with tool_key investor_portfolio).</p>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-xs uppercase text-slate-500">Profiles (all time, recent 50)</p>
            <p className="mt-1 text-2xl font-bold">{profiles.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-xs uppercase text-slate-500">Scenarios saved (recent 50)</p>
            <p className="mt-1 text-2xl font-bold">{scenarios.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-xs uppercase text-slate-500">Leads (investor_portfolio_lead)</p>
            <p className="mt-1 text-2xl font-bold">{leads.length}</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium">Event counts (30d)</h2>
          <ul className="mt-2 text-sm text-slate-300">
            {Object.entries(byEvent).map(([k, v]) => (
              <li key={k}>
                {k}: {v}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-medium">Top target cities (profiles sample)</h2>
            <ul className="mt-2 text-sm text-slate-300">
              {topCities.map(([c, n]) => (
                <li key={c}>
                  {c}: {n}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-medium">Strategies</h2>
            <ul className="mt-2 text-sm text-slate-300">
              {Object.entries(strategyTally).map(([k, n]) => (
                <li key={k}>
                  {k}: {n}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
