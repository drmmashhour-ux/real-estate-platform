import Link from "next/link";
import { MarketingHubClient } from "@/components/marketing/MarketingHubClient";
import { getMarketingHubDashboardPayload } from "@/modules/marketing/marketing-dashboard.service";
import { MarketingPanelClient } from "./marketing-panel-client";
import { engineFlags } from "@/config/feature-flags";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@repo/db";
import { canAccessAdminDashboard, resolveSeniorHubAccess } from "@/lib/senior-dashboard/role";

export const dynamic = "force-dynamic";

export default async function DashboardMarketingPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const studioHref = `/${locale}/${country}/dashboard/marketing-studio`;
  const contentStudioHref = `/${locale}/${country}/dashboard/admin/marketing/studio`;
  const seoHref = `/${locale}/${country}/dashboard/marketing/seo`;
  const videosHref = `/${locale}/${country}/dashboard/marketing/videos`;
  const calendarHref = `/${locale}/${country}/dashboard/marketing/calendar`;
  const autonomousMarketingHref = `/${locale}/${country}/dashboard/admin/marketing/ai`;
  const aiContentHref = `/${locale}/${country}/dashboard/marketing/ai-content`;
  const weekPlanHref = `/${locale}/${country}/dashboard/admin/marketing/week-plan`;

  const { userId } = await requireAuthenticatedUser();
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const access = u ? await resolveSeniorHubAccess(userId, u.role) : null;
  const canAdmin = access != null && canAccessAdminDashboard(access);

  const hub = await getMarketingHubDashboardPayload();

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketing Hub</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Scheduled distribution, performance, and growth-linked drafts. Legacy copy generator below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={calendarHref}
            className="shrink-0 rounded-lg border border-violet-600/50 bg-violet-950/40 px-3 py-2 text-sm text-violet-100 hover:border-violet-400 hover:bg-violet-950/60"
          >
            Content Calendar →
          </Link>
          <Link
            href={videosHref}
            className="shrink-0 rounded-lg border border-amber-600/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100 hover:border-amber-400 hover:bg-amber-950/60"
          >
            Video Engine →
          </Link>
          <Link
            href={seoHref}
            className="shrink-0 rounded-lg border border-sky-600/50 bg-sky-950/40 px-3 py-2 text-sm text-sky-200 hover:border-sky-500 hover:bg-sky-950/60"
          >
            SEO Engine →
          </Link>
          {engineFlags.marketingStudioV1 ? (
            <Link
              href={studioHref}
              className="shrink-0 rounded-lg border border-emerald-600/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 hover:border-emerald-500 hover:bg-emerald-950/60"
            >
              Marketing Studio (visual editor) →
            </Link>
          ) : null}
          {engineFlags.marketingStudioV1 && canAdmin ? (
            <Link
              href={contentStudioHref}
              className="shrink-0 rounded-lg border border-amber-600/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-200 hover:border-amber-500 hover:bg-amber-950/60"
            >
              Content + video studio (admin) →
            </Link>
          ) : null}
        </div>
      </div>

      <MarketingHubClient
        initial={hub}
        videosHref={videosHref}
        calendarHref={calendarHref}
        autonomousMarketingHref={autonomousMarketingHref}
        aiContentHref={aiContentHref}
        weekPlanHref={canAdmin ? weekPlanHref : undefined}
      />

      <div className="border-t border-white/10 pt-8">
        <h2 className="text-lg font-semibold text-zinc-300">Legacy copy pack</h2>
        <p className="mb-4 text-sm text-zinc-500">Deterministic headlines for ads — unchanged from previous Marketing page.</p>
        <MarketingPanelClient />
      </div>
    </div>
  );
}
