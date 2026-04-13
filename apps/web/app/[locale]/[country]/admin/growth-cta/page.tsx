import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";

export const dynamic = "force-dynamic";

type LaunchRow = {
  id: string;
  event: string;
  timestamp: Date;
  payload: unknown;
};

const TARGET_PATHS = ["/join-broker", "/start-listing", "/pricing", "/broker/apply", "/sell/create"];
const WINDOW_OPTIONS = [7, 30, 90] as const;

function getPayloadObject(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
}

function getPayloadString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function eventMatchesGrowthTarget(row: LaunchRow): boolean {
  const payload = getPayloadObject(row.payload);
  const path = getPayloadString(payload, "path");
  const href = getPayloadString(payload, "href");
  return TARGET_PATHS.includes(path ?? "") || TARGET_PATHS.includes(href ?? "");
}

function countBy(rows: LaunchRow[], predicate: (row: LaunchRow) => boolean) {
  return rows.reduce((sum, row) => sum + (predicate(row) ? 1 : 0), 0);
}

function ratioLabel(numerator: number, denominator: number): string {
  if (denominator <= 0) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function groupCtas(rows: LaunchRow[]) {
  const grouped = new Map<
    string,
    { label: string; href: string; count: number; page: string; placement: string; audience: string }
  >();

  for (const row of rows) {
    if (row.event !== "CTA_CLICK") continue;
    const payload = getPayloadObject(row.payload);
    const label = getPayloadString(payload, "label") ?? "unknown_cta";
    const href = getPayloadString(payload, "href") ?? "unknown";
    const page = getPayloadString(payload, "page") ?? "unknown";
    const placement = getPayloadString(payload, "placement") ?? "unknown";
    const audience = getPayloadString(payload, "audience") ?? "unknown";
    const key = `${label}:${href}:${page}:${placement}:${audience}`;
    const current = grouped.get(key);
    if (current) {
      current.count += 1;
    } else {
      grouped.set(key, { label, href, count: 1, page, placement, audience });
    }
  }

  return [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, 12);
}

function groupPlacements(rows: LaunchRow[]) {
  const grouped = new Map<
    string,
    { page: string; placement: string; audience: string; clicks: number }
  >();

  for (const row of rows) {
    if (row.event !== "CTA_CLICK") continue;
    const payload = getPayloadObject(row.payload);
    const page = getPayloadString(payload, "page") ?? "unknown";
    const placement = getPayloadString(payload, "placement") ?? "unknown";
    const audience = getPayloadString(payload, "audience") ?? "unknown";
    const key = `${page}:${placement}:${audience}`;
    const current = grouped.get(key);
    if (current) {
      current.clicks += 1;
    } else {
      grouped.set(key, { page, placement, audience, clicks: 1 });
    }
  }

  return [...grouped.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 12);
}

export default async function AdminGrowthCtaPage({
  searchParams,
}: {
  searchParams?: Promise<{ days?: string }>;
}) {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  const params = searchParams ? await searchParams : undefined;
  const requestedDays = Number(params?.days ?? 30);
  const days = WINDOW_OPTIONS.includes(requestedDays as (typeof WINDOW_OPTIONS)[number]) ? requestedDays : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.launchEvent
    .findMany({
      where: {
        createdAt: { gte: since },
        OR: [
          { event: "PAGE_VIEW" },
          { event: "CTA_CLICK" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: { id: true, event: true, timestamp: true, payload: true },
    })
    .catch(() => [] as LaunchRow[]);

  const relevantRows = rows.filter(eventMatchesGrowthTarget);
  const brokerPageViews = countBy(
    relevantRows,
    (row) => row.event === "PAGE_VIEW" && getPayloadString(getPayloadObject(row.payload), "path") === "/join-broker"
  );
  const sellerPageViews = countBy(
    relevantRows,
    (row) => row.event === "PAGE_VIEW" && getPayloadString(getPayloadObject(row.payload), "path") === "/start-listing"
  );
  const pricingPageViews = countBy(
    relevantRows,
    (row) => row.event === "PAGE_VIEW" && getPayloadString(getPayloadObject(row.payload), "path") === "/pricing"
  );
  const brokerApplyClicks = countBy(
    relevantRows,
    (row) => row.event === "CTA_CLICK" && getPayloadString(getPayloadObject(row.payload), "href") === "/broker/apply"
  );
  const sellerCreateClicks = countBy(
    relevantRows,
    (row) => row.event === "CTA_CLICK" && getPayloadString(getPayloadObject(row.payload), "href") === "/sell/create"
  );
  const brokerConversionRate = ratioLabel(brokerApplyClicks, brokerPageViews);
  const sellerConversionRate = ratioLabel(sellerCreateClicks, sellerPageViews);
  const pricingBrokerInterestClicks = countBy(
    relevantRows,
    (row) =>
      row.event === "CTA_CLICK" &&
      ["/join-broker", "/pricing/broker", "/broker/apply"].includes(
        getPayloadString(getPayloadObject(row.payload), "href") ?? ""
      )
  );
  const pricingSellerInterestClicks = countBy(
    relevantRows,
    (row) =>
      row.event === "CTA_CLICK" &&
      ["/start-listing", "/pricing/seller", "/sell/create"].includes(
        getPayloadString(getPayloadObject(row.payload), "href") ?? ""
      )
  );
  const pricingBrokerInterestRate = ratioLabel(pricingBrokerInterestClicks, pricingPageViews);
  const pricingSellerInterestRate = ratioLabel(pricingSellerInterestClicks, pricingPageViews);
  const topCtas = groupCtas(relevantRows);
  const placementBreakdown = groupPlacements(relevantRows);
  const recentRows = relevantRows.slice(0, 20);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">Growth intelligence</p>
      <h1 className="mt-2 text-3xl font-semibold">Broker and seller CTA report</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-400">
        Last {days} days of growth funnel movement for the new conversion pages. Use this to see whether broker and seller
        traffic is turning into application and listing-start intent.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/join-broker" className="text-emerald-400 hover:text-emerald-300">
          Open broker page
        </Link>
        <Link href="/start-listing" className="text-emerald-400 hover:text-emerald-300">
          Open seller page
        </Link>
        <Link href="/pricing" className="text-slate-400 hover:text-slate-300">
          Open pricing overview
        </Link>
        <Link href="/admin/growth-dashboard" className="text-slate-500 hover:text-slate-300">
          Growth dashboard
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {WINDOW_OPTIONS.map((option) => {
          const active = option === days;
          return (
            <Link
              key={option}
              href={`/admin/growth-cta?days=${option}`}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? "border-premium-gold/40 bg-premium-gold/10 text-premium-gold"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-premium-gold/30 hover:text-premium-gold"
              }`}
            >
              {option}d
            </Link>
          );
        })}
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Broker page views</p>
          <p className="mt-1 text-2xl font-semibold text-white">{brokerPageViews}</p>
          <p className="mt-1 text-xs text-slate-500">`/join-broker` in last {days} days</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Seller page views</p>
          <p className="mt-1 text-2xl font-semibold text-white">{sellerPageViews}</p>
          <p className="mt-1 text-xs text-slate-500">`/start-listing` in last {days} days</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Pricing page views</p>
          <p className="mt-1 text-2xl font-semibold text-white">{pricingPageViews}</p>
          <p className="mt-1 text-xs text-slate-500">`/pricing` in last {days} days</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Broker apply clicks</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{brokerApplyClicks}</p>
          <p className="mt-1 text-xs text-slate-500">Clicks to `broker/apply` · conversion {brokerConversionRate}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Listing start clicks</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{sellerCreateClicks}</p>
          <p className="mt-1 text-xs text-slate-500">Clicks to `sell/create` · conversion {sellerConversionRate}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Broker page efficiency</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{brokerConversionRate}</p>
          <p className="mt-1 text-xs text-slate-500">Broker apply clicks divided by `/join-broker` page views.</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Seller page efficiency</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{sellerConversionRate}</p>
          <p className="mt-1 text-xs text-slate-500">Listing start clicks divided by `/start-listing` page views.</p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-950/10 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Pricing page split</p>
          <p className="mt-1 text-lg font-semibold text-sky-300">
            Broker {pricingBrokerInterestRate} · Seller {pricingSellerInterestRate}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            How often `/pricing` traffic continues into broker or seller interest actions.
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-lg font-semibold text-white">Top CTA placements</h2>
          <p className="mt-1 text-sm text-slate-400">Which buttons are driving the most intent right now.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="px-3 py-2 font-medium">Label</th>
                  <th className="px-3 py-2 font-medium">Page</th>
                  <th className="px-3 py-2 font-medium">Placement</th>
                  <th className="px-3 py-2 font-medium">Audience</th>
                  <th className="px-3 py-2 font-medium">Href</th>
                  <th className="px-3 py-2 font-medium">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {topCtas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                      No CTA clicks recorded yet.
                    </td>
                  </tr>
                ) : (
                  topCtas.map((cta) => (
                    <tr key={`${cta.label}-${cta.href}-${cta.page}`} className="border-b border-slate-800/70">
                      <td className="px-3 py-2 font-mono text-xs text-emerald-300">{cta.label}</td>
                      <td className="px-3 py-2 text-slate-300">{cta.page}</td>
                      <td className="px-3 py-2 text-slate-300">{cta.placement}</td>
                      <td className="px-3 py-2 text-slate-300">{cta.audience}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-400">{cta.href}</td>
                      <td className="px-3 py-2 text-white">{cta.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-lg font-semibold text-white">Source breakdown by placement</h2>
          <p className="mt-1 text-sm text-slate-400">
            Compare which surfaces generate the most CTA intent across homepage, landing pages, navbar, footer, and pricing.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="px-3 py-2 font-medium">Page</th>
                  <th className="px-3 py-2 font-medium">Placement</th>
                  <th className="px-3 py-2 font-medium">Audience</th>
                  <th className="px-3 py-2 font-medium">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {placementBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                      No placement click data yet.
                    </td>
                  </tr>
                ) : (
                  placementBreakdown.map((row) => (
                    <tr key={`${row.page}-${row.placement}-${row.audience}`} className="border-b border-slate-800/70">
                      <td className="px-3 py-2 text-slate-300">{row.page}</td>
                      <td className="px-3 py-2 text-slate-300">{row.placement}</td>
                      <td className="px-3 py-2 text-slate-300">{row.audience}</td>
                      <td className="px-3 py-2 font-semibold text-white">{row.clicks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-lg font-semibold text-white">Recent growth funnel events</h2>
          <p className="mt-1 text-sm text-slate-400">Latest page views and CTA clicks for the new growth pages.</p>
          <div className="mt-4 space-y-3">
            {recentRows.length === 0 ? (
              <p className="text-sm text-slate-500">No broker/seller funnel activity recorded yet.</p>
            ) : (
              recentRows.map((row) => {
                const payload = getPayloadObject(row.payload);
                return (
                  <div key={row.id} className="rounded-lg border border-slate-800 bg-black/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-mono text-xs text-premium-gold">{row.event}</p>
                      <p className="font-mono text-[11px] text-slate-500">{row.timestamp.toISOString()}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      {getPayloadString(payload, "label") ?? getPayloadString(payload, "path") ?? "growth event"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      href: {getPayloadString(payload, "href") ?? "—"} · page: {getPayloadString(payload, "page") ?? "—"} ·
                      placement: {getPayloadString(payload, "placement") ?? "—"}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
