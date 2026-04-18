import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@/lib/db";
import { SyriaRegionPanel } from "@/components/global/admin/SyriaRegionPanel";
import { SyriaPreviewPanel } from "@/components/global/admin/SyriaPreviewPanel";
import { engineFlags } from "@/config/feature-flags";
import { autonomousMarketplaceEngine } from "@/modules/autonomous-marketplace/execution/autonomous-marketplace.engine";
import { getIntelligenceDashboardPayload } from "@/src/modules/ai/intelligenceSnapshot";

export const dynamic = "force-dynamic";

function maxCount(cells: { count: number }[]) {
  return Math.max(1, ...cells.map((c) => c.count));
}

export default async function AdminIntelligencePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/intelligence");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");
  const role = await getUserRole();
  const data = await getIntelligenceDashboardPayload();
  const heatMax = maxCount(data.heatmap);

  const sp = searchParams ? await searchParams : {};
  const rawListing = sp.syriaListing;
  const syriaListingParam = typeof rawListing === "string" ? rawListing.trim() : "";

  let syriaPreview = null as Awaited<ReturnType<typeof autonomousMarketplaceEngine.previewForListing>> | null;
  if (engineFlags.syriaRegionAdapterV1 && engineFlags.syriaPreviewV1 && syriaListingParam) {
    syriaPreview = await autonomousMarketplaceEngine.previewForListing({
      listingId: syriaListingParam,
      source: "syria",
      regionCode: "sy",
      dryRun: true,
    });
  }

  return (
    <HubLayout title="Intelligence" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-10">
        <div>
          <h1 className="text-xl font-semibold text-white">Autopilot intelligence</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Search heatmap (views + inquiries), top pages and listings, channel mix, conversion funnel from{" "}
            <code className="text-slate-300">user_events</code>, and CRM segments from{" "}
            <code className="text-slate-300">user_scores</code>. Feeds the LECIPM autonomous layer (
            <Link href="/admin/growth-dashboard" className="text-premium-gold hover:underline">
              growth dashboard
            </Link>
            ).
          </p>
        </div>

        <SyriaRegionPanel />

        {engineFlags.syriaRegionAdapterV1 && engineFlags.syriaPreviewV1 ? (
          <SyriaPreviewPanel listingId={syriaListingParam} preview={syriaPreview} />
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Search &amp; browse heatmap</h2>
          <p className="mt-1 text-xs text-slate-600">Derived from listing views and inquiries (metadata.city when present).</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.heatmap.length === 0 ? (
              <p className="text-sm text-slate-500">No signals in the last 14 days.</p>
            ) : (
              data.heatmap.map((cell) => (
                <div
                  key={cell.label}
                  className="rounded-xl border border-white/10 px-4 py-3"
                  style={{
                    backgroundColor: `rgba(212, 175, 55, ${0.12 + (cell.count / heatMax) * 0.45})`,
                  }}
                >
                  <p className="text-xs font-medium text-slate-200">{cell.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{cell.count}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Top pages</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {data.topPages.map((p) => (
                <li key={p.path} className="flex justify-between gap-2 border-b border-white/5 py-2 last:border-0">
                  <span className="min-w-0 truncate font-mono text-xs text-slate-400">{p.path}</span>
                  <span className="shrink-0 text-white">{p.views}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Top listings</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {data.topListings.map((l) => (
                <li key={l.listingId} className="flex justify-between gap-2 border-b border-white/5 py-2 last:border-0">
                  <span className="min-w-0 truncate">
                    {l.listingCode ? <span className="text-premium-gold">{l.listingCode}</span> : null}{" "}
                    <span className="text-slate-400">{l.listingId.slice(0, 8)}…</span>
                  </span>
                  <span className="shrink-0 text-white">{l.views}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Conversion funnel</h2>
            <p className="mt-1 text-xs text-slate-600">Last {data.conversion.sinceDays} days (event counts).</p>
            <ul className="mt-4 space-y-2 text-sm">
              {Object.entries(data.conversion.counts).map(([k, v]) => (
                <li key={k} className="flex justify-between border-b border-white/5 py-2 text-slate-300 last:border-0">
                  <span>{k}</span>
                  <span className="font-semibold text-white">{v}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Channels</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {data.channels.map((c) => (
                <li key={c.channel} className="flex justify-between gap-2 border-b border-white/5 py-2 last:border-0">
                  <span>{c.channel}</span>
                  <span className="text-white">{c.leads}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">User segmentation</h2>
          <p className="mt-1 text-xs text-slate-600">From table `user_scores` (autopilot CRM scoring).</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {(
              [
                ["Hot", data.segments.hot],
                ["Warm", data.segments.warm],
                ["Cold", data.segments.cold],
                ["Total scored", data.segments.total],
              ] as const
            ).map(([label, n]) => (
              <div key={label} className="rounded-xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{n}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </HubLayout>
  );
}
