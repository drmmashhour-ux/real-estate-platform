import { getGuestId } from "@/lib/auth/session";
import {
  dedupeAgainstSeen,
  getPersonalizedBnhubListings,
  getRecentlyViewedBnhubListings,
  getTrendingBnhubListings,
} from "@/lib/recommendations";
import { StaysRecommendationGrid } from "@/components/recommendations/StaysRecommendationGrid";
import { RecommendationsImpressionBeacon } from "@/components/recommendations/RecommendationsImpressionBeacon";

export async function HomeBnhubRecommendationRails({
  locale,
  country,
}: {
  locale: string;
  country: string;
}) {
  const guestId = await getGuestId();
  const hrefPrefix = `/${locale}/${country}`;

  const [trending, forYou, recentRaw] = await Promise.all([
    getTrendingBnhubListings({ limit: 6 }),
    getPersonalizedBnhubListings(guestId, 6),
    guestId ? getRecentlyViewedBnhubListings(guestId, 6) : Promise.resolve([]),
  ]);

  const seen = new Set<string>();
  const trendingDedup = dedupeAgainstSeen(trending, seen);
  const forYouDedup = dedupeAgainstSeen(forYou, seen);
  const recentDedup = dedupeAgainstSeen(recentRaw, seen);

  return (
    <div className="border-t border-white/10 bg-black pb-12 pt-8 md:pb-16 md:pt-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <StaysRecommendationGrid
          variant="dark"
          hrefPrefix={hrefPrefix}
          title="Trending stays"
          subtitle="Popular right now from real guest activity"
          items={trendingDedup}
          viewAllHref={`${hrefPrefix}/bnhub/stays`}
          viewAllLabel="Browse stays →"
          sectionId="home-reco-trending"
        />
        {trendingDedup.length > 0 ? (
          <RecommendationsImpressionBeacon
            listingIds={trendingDedup.map((x) => x.id)}
            widget="home_trending"
            source="trending"
          />
        ) : null}

        <div className="mt-12">
          <StaysRecommendationGrid
            variant="dark"
            hrefPrefix={hrefPrefix}
            title={guestId ? "Recommended for you" : "Popular stays"}
            subtitle={guestId ? "Based on your searches and saves" : "Verified hosts across Québec"}
            items={forYouDedup}
            viewAllHref={`${hrefPrefix}/bnhub/stays?sort=recommended`}
            viewAllLabel="More for you →"
            sectionId="home-reco-foryou"
          />
        </div>
        {forYouDedup.length > 0 ? (
          <RecommendationsImpressionBeacon
            listingIds={forYouDedup.map((x) => x.id)}
            widget="home_personalized"
            source="personalized"
          />
        ) : null}

        {guestId && recentDedup.length > 0 ? (
          <div className="mt-12">
            <StaysRecommendationGrid
              variant="dark"
              hrefPrefix={hrefPrefix}
              title="Continue browsing"
              subtitle="Stays you recently viewed"
              items={recentDedup}
              sectionId="home-reco-recent"
            />
            <RecommendationsImpressionBeacon
              listingIds={recentDedup.map((x) => x.id)}
              widget="home_recent"
              source="recent"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
