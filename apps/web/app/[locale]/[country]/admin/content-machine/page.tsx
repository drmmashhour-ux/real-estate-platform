import { redirect } from "next/navigation";
import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { ListingStatus } from "@prisma/client";
import { prisma } from "@repo/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { ContentTrafficFlywheelStrip } from "@/components/admin/ContentTrafficFlywheelStrip";
import { ListingTrafficFunnelStrip } from "@/components/admin/ListingTrafficFunnelStrip";
import { ContentMachineAdminClient } from "./content-machine-admin-client";
import { getBestPerformingStyles } from "@/lib/content-machine/pipeline";
import { getStylePerformanceRollup } from "@/lib/content-machine/analytics";
import {
  contentMachinePerformanceScore,
  getTopPerformingMachineContent,
} from "@/lib/content-machine/performance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminContentMachinePage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/admin/content-machine");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== "ADMIN") redirect("/dashboard");

  const role = await getUserRole();

  const [rows, listings, styleStats, topByScore, styleRollup] = await Promise.all([
    prisma.machineGeneratedContent.findMany({
      take: 120,
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { id: true, title: true, listingCode: true } },
      },
    }),
    prisma.shortTermListing.findMany({
      where: { listingStatus: ListingStatus.PUBLISHED },
      take: 300,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, listingCode: true },
    }),
    getBestPerformingStyles(8).catch(() => []),
    getTopPerformingMachineContent({ limit: 25, orderBy: "score" }).catch(() => []),
    getStylePerformanceRollup().catch(() => []),
  ]);

  return (
    <HubLayout
      title="Content machine"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-6">
        <div>
          <Link href="/admin/content-generator" className="text-xs text-premium-gold hover:underline">
            ← TikTok script generator
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-white">Automated short-form content</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            OpenAI/deterministic copy → vertical 9:16 JPEG cards (hook overlay) → schedule slots. Enable{" "}
            <code className="text-slate-300">CONTENT_MACHINE_ENABLED=1</code> to run on listing create/update with the
            BNHUB content pipeline. Cron: <code className="text-slate-300">GET /api/cron/content-machine?secret=…</code>{" "}
            · self-improving batch:{" "}
            <code className="text-slate-300">GET /api/cron/content-optimization?secret=…</code>
            . Track BNHUB listing visits from social with{" "}
            <code className="text-slate-300">?cc=&lt;content_piece_id&gt;</code> on the stay URL — views, clicks, and
            booking starts roll up per piece and style.
          </p>
        </div>

        <ListingTrafficFunnelStrip />

        <ContentTrafficFlywheelStrip />

        {styleRollup.length > 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
            <p className="font-semibold text-slate-100">By style (weighted score sum · v / clk / conv)</p>
            <ul className="mt-2 flex flex-wrap gap-3">
              {styleRollup.map((s) => (
                <li key={s.style} className="rounded-md bg-black/30 px-2 py-1 font-mono text-[11px]">
                  <span className="text-premium-gold">{s.style}</span> · scoreΣ {Math.round(s.scoreSum)} · v {s.views} ·{" "}
                  {s.clicks} · conv {s.conversions} · n={s.pieces}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-slate-500">
              Score = views + 5×clicks + 25×conversions per piece, summed. JSON:{" "}
              <code className="text-slate-400">GET /api/admin/content-machine/analytics/summary</code>
            </p>
          </div>
        ) : null}

        {styleStats.length > 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
            <p className="font-semibold text-slate-100">Style performance (legacy groupBy · sum conversions)</p>
            <ul className="mt-2 flex flex-wrap gap-3">
              {styleStats.map((s) => (
                <li key={s.style} className="rounded-md bg-black/30 px-2 py-1 font-mono text-[11px]">
                  {s.style}: conv {s._sum.conversions ?? 0} · views {s._sum.views ?? 0} · n={s._count.id}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ContentMachineAdminClient
          leaderboardRows={topByScore.map((r) => ({
            id: r.id,
            style: r.style,
            hook: r.hook,
            views: r.views,
            clicks: r.clicks,
            conversions: r.conversions,
            score: contentMachinePerformanceScore(r.views, r.clicks, r.conversions),
            listing: r.listing,
          }))}
          initialRows={rows.map((r) => ({
            id: r.id,
            style: r.style,
            hook: r.hook,
            caption: r.caption,
            status: r.status,
            videoUrl: r.videoUrl,
            views: r.views,
            clicks: r.clicks,
            conversions: r.conversions,
            createdAt: r.createdAt.toISOString(),
            listing: r.listing,
          }))}
          listings={listings}
        />
      </div>
    </HubLayout>
  );
}
