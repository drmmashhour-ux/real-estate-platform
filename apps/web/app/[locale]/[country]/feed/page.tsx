import type { Metadata } from "next";

import { ListingFeed } from "@/components/feed/ListingFeed";
import { getUserProfile } from "@/lib/ai/userProfile";
import { flags } from "@/lib/flags";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: "Discover Listings",
    description: "A personalized stream of short-term stays tailored to you — find your next place without searching.",
    path: "/feed",
    locale,
    country,
  });
}

export default async function FeedPage({ params }: { params: Promise<{ locale: string; country: string }> }) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}`;
  const userProfile = await getUserProfile();

  return (
    <main className="min-h-svh w-full max-w-3xl mx-auto px-0 pb-8 pt-4 sm:pt-6">
      <div className="px-4 pb-4 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Discover Listings</h1>
        {flags.RECOMMENDATIONS ? (
          <p className="mt-1 text-sm text-muted-foreground">Stays picked for you — swipe, tap, book.</p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Latest published stays, newest first.</p>
        )}
      </div>
      <ListingFeed
        userProfile={userProfile}
        basePath={basePath}
        recommendationsEnabled={flags.RECOMMENDATIONS}
      />
    </main>
  );
}
