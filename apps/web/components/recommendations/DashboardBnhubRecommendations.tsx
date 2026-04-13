import {
  getPersonalizedBnhubListings,
  getSavedBasedBnhubListings,
} from "@/lib/recommendations";
import { StaysRecommendationGrid } from "@/components/recommendations/StaysRecommendationGrid";
import { RecommendationsImpressionBeacon } from "@/components/recommendations/RecommendationsImpressionBeacon";

export async function DashboardBnhubRecommendations({
  userId,
  hrefPrefix,
}: {
  userId: string;
  hrefPrefix: string;
}) {
  const [forYou, savedBased] = await Promise.all([
    getPersonalizedBnhubListings(userId, 4),
    getSavedBasedBnhubListings(userId, 4),
  ]);

  const primary = forYou.length >= 3 ? forYou : savedBased.length ? savedBased : forYou;
  if (primary.length === 0) return null;

  return (
    <section className="card-premium overflow-hidden p-0">
      <div className="border-b border-white/10 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">Stays for you</h2>
        <p className="mt-1 text-sm text-premium-secondary">BNHub picks from your activity</p>
      </div>
      <div className="px-4 py-4 sm:px-6">
        <StaysRecommendationGrid
          variant="dark"
          hrefPrefix={hrefPrefix}
          title=""
          items={primary}
          sectionId="dashboard-bnhub-reco"
        />
        <RecommendationsImpressionBeacon
          listingIds={primary.map((x) => x.id)}
          widget="dashboard_bnhub"
          source={savedBased.length >= 3 && forYou.length < 3 ? "saved" : "personalized"}
        />
      </div>
    </section>
  );
}
