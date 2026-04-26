import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { getCitySupplyDemandSnapshot } from "@/modules/multi-city/cityMetrics";
import { rankCitiesByOpportunity, suggestNextExpansionSlug } from "@/modules/multi-city/expansionEngine";
import { AdminCitiesClient, type CityDashboardRow } from "@/components/admin/cities/AdminCitiesClient";

export const dynamic = "force-dynamic";

export default async function AdminCitiesPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  const cities = await prisma.city.findMany({
    orderBy: [{ country: "asc" }, { name: "asc" }],
  });

  const metricsList = await Promise.all(
    cities.map(async (c) => {
      const metrics = await getCitySupplyDemandSnapshot(prisma, c);
      return { c, metrics };
    })
  );

  const rows: CityDashboardRow[] = metricsList.map(({ c, metrics }) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    country: c.country,
    region: c.region,
    status: c.status,
    launchDate: c.launchDate ? c.launchDate.toISOString().slice(0, 10) : null,
    listingsEnabled: c.listingsEnabled,
    searchPagesEnabled: c.searchPagesEnabled,
    growthEngineEnabled: c.growthEngineEnabled,
    expansionScore: c.expansionScore,
    playbookMessaging: c.playbookMessaging,
    playbookPricing: c.playbookPricing,
    playbookStrategy: c.playbookStrategy,
    metrics,
  }));

  const ranked = rankCitiesByOpportunity(cities.map((c) => ({ slug: c.slug, expansionScore: c.expansionScore })));
  const suggestedNextSlug = suggestNextExpansionSlug(
    cities.map((c) => ({ slug: c.slug, status: c.status, expansionScore: c.expansionScore }))
  );

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">LECIPM · Markets</p>
      <h1 className="mt-2 text-3xl font-semibold">Cities & rollout</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Per-market supply/demand, revenue from BNHUB stays (90d), and controlled launch: enabling listings, search surfaces,
        and growth engine together. Local playbooks (messaging, pricing, strategy) live on each city row.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/launch" className="text-emerald-400 hover:text-emerald-300">
          ← Launch tracking
        </Link>
        <Link href="/admin/growth-engine" className="text-slate-400 hover:text-slate-300">
          Growth engine
        </Link>
      </div>
      {ranked.length > 0 ? (
        <p className="mt-4 text-xs text-slate-500">
          Ranked by cached score: {ranked.map((x) => `${x.slug} (${x.score})`).join(" · ")}
        </p>
      ) : null}

      <div className="mt-8">
        <AdminCitiesClient rows={rows} suggestedNextSlug={suggestedNextSlug} />
      </div>
    </main>
  );
}
