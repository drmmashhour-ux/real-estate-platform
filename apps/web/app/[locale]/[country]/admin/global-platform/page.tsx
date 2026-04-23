import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@repo/db";
import { listActiveCountries } from "@/src/modules/global/countries";
import { leadDemandByCountry } from "@/src/modules/data/demandAnalytics";
import { leadVolumeTrend, expansionCityTrend } from "@/src/modules/data/trends";

export const dynamic = "force-dynamic";

export default async function GlobalPlatformAdminPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/global-platform");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");
  const role = await getUserRole();

  let countries: Awaited<ReturnType<typeof listActiveCountries>> = [];
  let leadByCountry: Record<string, number> = {};
  let leadTrend: Awaited<ReturnType<typeof leadVolumeTrend>> | null = null;
  let cities: Awaited<ReturnType<typeof expansionCityTrend>> = [];
  let partnerRevenue: { currency: string; _sum: { amountCents: number | null } }[] = [];
  const apiKeys = 0;
  const partners = 0;

  try {
    [countries, leadByCountry, leadTrend, cities, partnerRevenue] = await Promise.all([
      listActiveCountries(),
      leadDemandByCountry(30),
      leadVolumeTrend(),
      expansionCityTrend(),
      prisma.platformRevenueEvent.groupBy({
        by: ["currency"],
        _sum: { amountCents: true },
      }),
    ]);
  } catch {
    /* tables may not exist until migrate */
  }

  return (
    <HubLayout title="Global platform" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-10">
        <div>
          <h1 className="text-xl font-semibold text-white">Global infrastructure</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Multi-country configs, public API v1 (<code className="text-slate-300">/api/v1/listings</code>,{" "}
            <code className="text-slate-300">bookings</code>, <code className="text-slate-300">leads</code>,{" "}
            <code className="text-slate-300">analytics</code>), partners, and regional monetization. See{" "}
            <Link href="/admin/ai-ceo" className="text-premium-gold hover:underline">
              AI CEO
            </Link>{" "}
            for autonomous execution.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
            <p className="text-xs uppercase text-slate-500">Active API keys</p>
            <p className="mt-2 text-3xl font-semibold text-white">{apiKeys}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
            <p className="text-xs uppercase text-slate-500">Partners</p>
            <p className="mt-2 text-3xl font-semibold text-white">{partners}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
            <p className="text-xs uppercase text-slate-500">Expansion cities</p>
            <p className="mt-2 text-3xl font-semibold text-white">{cities.length}</p>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Countries (config)</h2>
          {countries.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No rows in `global_country_configs` — run `launchCountry()` or migrate.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {countries.map((c) => (
                <li key={c.countryCode} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-2 last:border-0">
                  <span>
                    <span className="font-mono text-premium-gold">{c.countryCode}</span> {c.displayName}
                  </span>
                  <span className="text-slate-500">
                    {c.defaultCurrency.toUpperCase()} · {c.defaultLocale} · SEO {c.seoActivated ? "on" : "off"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Leads by region (30d)</h2>
            <ul className="mt-4 space-y-1 text-sm text-slate-300">
              {Object.entries(leadByCountry)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span className="text-white">{v}</span>
                  </li>
                ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Growth metrics</h2>
            {leadTrend ? (
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>Leads last 7d: {leadTrend.last7}</li>
                <li>Leads prior 7d: {leadTrend.prev7}</li>
                <li>Week-over-week: {leadTrend.deltaPct}%</li>
              </ul>
            ) : null}
            <h3 className="mt-6 text-xs uppercase text-slate-600">Recent expansion cities</h3>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-500">
              {cities.slice(0, 8).map((c) => (
                <li key={c.slug}>
                  {c.displayName} ({c.slug})
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Partner revenue by currency</h2>
          <ul className="mt-4 space-y-1 text-sm text-slate-300">
            {partnerRevenue.length === 0 ? (
              <li className="text-slate-500">No `platform_revenue_events` yet.</li>
            ) : (
              partnerRevenue.map((r) => (
                <li key={r.currency} className="flex justify-between">
                  <span>{r.currency.toUpperCase()}</span>
                  <span className="text-white">{((r._sum.amountCents ?? 0) / 100).toFixed(2)}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </HubLayout>
  );
}
