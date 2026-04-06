import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LandingFeaturedListings } from "@/components/marketing/LandingFeaturedListings";
import { LandingRecommendedStays } from "@/components/marketing/LandingRecommendedStays";
import { LandingHeroSearch } from "@/components/marketing/LandingHeroSearch";
import { PLATFORM_NAME } from "@/config/branding";

const title = "Search smarter. Invest confidently.";
const description =
  "AI-powered real estate platform for buying, renting, hosting, and investing — all in one place.";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["real estate", "buy home", "rent", "BNHub", "LECIPM", PLATFORM_NAME],
  ...(siteUrl
    ? {
        metadataBase: new URL(siteUrl),
        openGraph: {
          title: `${title} | ${PLATFORM_NAME}`,
          description,
          url: siteUrl,
          siteName: PLATFORM_NAME,
          type: "website",
          locale: "en_CA",
        },
        twitter: {
          card: "summary_large_image",
          title: `${title} | ${PLATFORM_NAME}`,
          description,
        },
      }
    : {
        openGraph: { title: `${title} | ${PLATFORM_NAME}`, description, type: "website" },
        twitter: { card: "summary_large_image", title: `${title} | ${PLATFORM_NAME}`, description },
      }),
};

function FeaturedFallback() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="aspect-[4/3] animate-pulse rounded-2xl border border-[#D4AF37]/20 bg-white/5"
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-black text-white">
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:py-24" aria-label="Hero">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:items-center lg:gap-8">
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Search smarter. Invest confidently.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                AI-powered real estate platform for buying, renting, hosting, and investing — all in one place.
              </p>
            </div>
            <LandingHeroSearch />
          </div>

          <div className="relative w-full">
            <Image
              src={HERO_IMAGE}
              alt="Modern residential property exterior"
              width={1200}
              height={900}
              className="h-auto w-full rounded-2xl object-cover shadow-[0_24px_48px_rgba(0,0,0,0.5),0_0_72px_rgba(212,175,55,0.14)]"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="border-t border-[#D4AF37]/20 px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-7xl">
          <h2 id="featured-heading" className="text-center text-2xl font-bold sm:text-3xl">
            Featured properties
          </h2>
          <div className="mt-8">
            <Suspense fallback={<FeaturedFallback />}>
              <LandingFeaturedListings />
            </Suspense>
          </div>
        </div>
      </section>

      <LandingRecommendedStays />
    </div>
  );
}
