import { VideoEngineVideosClient } from "@/components/marketing/VideoEngineVideosClient";
import { getVideoEngineVideosAdminPayload } from "@/modules/video-engine/video-project.service";

export const dynamic = "force-dynamic";

export default async function MarketingVideosPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const marketingHubHref = `/${locale}/${country}/dashboard/marketing`;
  const initial = await getVideoEngineVideosAdminPayload();

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 text-white">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Video Content Engine</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Template-based reels from listings, BNHub stays, investor deals, and residences — black &amp; gold brand, admin-reviewed,
          export-ready manifests.
        </p>
      </div>

      <VideoEngineVideosClient marketingHubHref={marketingHubHref} initial={initial} />
    </div>
  );
}
