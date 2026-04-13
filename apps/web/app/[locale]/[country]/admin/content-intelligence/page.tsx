import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { loadContentIntelligenceDashboard } from "@/lib/content-intelligence/dashboard-data";
import { legacyScoreFromRow } from "@/lib/content-intelligence/scoring";
import { ContentIntelligenceClient } from "./content-intelligence-client";

export const dynamic = "force-dynamic";

export default async function AdminContentIntelligencePage() {
  let data: Awaited<ReturnType<typeof loadContentIntelligenceDashboard>> | null = null;
  let loadError: string | null = null;
  try {
    data = await loadContentIntelligenceDashboard();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load intelligence data.";
  }

  const serialized = data
    ? {
        ...data,
        top: data.top.map((r) => ({
          id: r.id,
          style: r.style,
          hook: r.hook.slice(0, 160),
          score: r.performanceScore ?? legacyScoreFromRow(r),
          views: r.views,
          clicks: r.clicks,
          saves: r.saves,
          shares: r.shares,
          bookings: r.bookings,
          revenueCents: r.revenueCents,
          listing: r.listing,
        })),
        worst: data.worst.map((r) => ({
          id: r.id,
          style: r.style,
          hook: r.hook.slice(0, 160),
          score: r.performanceScore ?? legacyScoreFromRow(r),
          views: r.views,
          listing: r.listing,
        })),
        signals: data.signals
          ? {
              ...data.signals,
              stylesRanked: data.signals.stylesRanked,
              hookExamples: data.signals.hookExamples,
              worstHookExamples: data.signals.worstHookExamples,
              ctaBuckets: data.signals.ctaBuckets,
              visualOrderStats: data.signals.visualOrderStats,
              cityStyleHints: data.signals.cityStyleHints,
            }
          : null,
      }
    : null;

  return (
    <HubLayout title="Content intelligence" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 text-white">
        <div>
          <h1 className="font-serif text-2xl text-amber-400">Content learning loop</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            Scores blend views, clicks, saves, shares, conversions, bookings, and attributed revenue. Winners feed
            recommendations and softly bias new LECIPM pack generation — with exploration so copy stays diverse.
          </p>
          {loadError ? (
            <p className="mt-3 rounded-lg border border-amber-900/50 bg-amber-950/30 p-3 text-sm text-amber-200">
              {loadError} Apply the Prisma migration for `MachineGeneratedContent` metrics if needed.
            </p>
          ) : null}
        </div>

        {serialized ? <ContentIntelligenceClient initial={serialized} /> : null}
      </div>
    </HubLayout>
  );
}
