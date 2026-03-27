import { AIDealAnalyzerSection } from "@/components/landing/AIDealAnalyzerSection";
import { BrokerWorkspacePreview } from "@/components/landing/BrokerWorkspacePreview";
import { FeaturedPropertyCard } from "@/components/landing/FeaturedPropertyCard";
import { InvestorPositioningSection } from "@/components/landing/InvestorPositioningSection";
import { InvestorToolsSection } from "@/components/landing/InvestorToolsSection";
import { LandingHero } from "@/components/landing/LandingHero";
import { PlatformAccessSection } from "@/components/landing/PlatformAccessSection";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";
import { FEATURED_PROPERTY_MOCKS } from "@/lib/landing/featured-mocks";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop";

function sqmToSqft(sqm: number | null | undefined): number | null {
  if (sqm == null) return null;
  return Math.round(sqm * 10.7639);
}

type FeaturedRow = {
  id: string;
  title: string;
  city: string;
  priceLabel: string;
  beds: number;
  baths: number;
  sqft: number | null;
  imageUrl: string;
  detailHref?: string;
};

export default async function HomePage() {
  const featuredDb = await prisma.property.findMany({
    where: { status: "ACTIVE" },
    take: 3,
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  const mocksNeeded = Math.max(0, 3 - featuredDb.length);
  const mockSlice = FEATURED_PROPERTY_MOCKS.slice(0, mocksNeeded);

  const cards: FeaturedRow[] = [
    ...featuredDb.map((p) => ({
      id: p.id,
      title: p.title,
      city: p.city,
      priceLabel: `$${Number(p.price).toLocaleString()} CAD`,
      beds: p.bedrooms,
      baths: p.bathrooms,
      sqft: sqmToSqft(p.areaSqm),
      imageUrl: p.images[0]?.url ?? FALLBACK_IMG,
    })),
    ...mockSlice.map((m) => ({
      id: m.id,
      title: m.title,
      city: m.city,
      priceLabel: m.priceLabel,
      beds: m.beds,
      baths: m.baths,
      sqft: m.sqft,
      imageUrl: m.imageUrl,
      detailHref: "/properties",
    })),
  ];

  return (
    <>
      <Navbar />
      <main className="bg-[#0B0B0B]">
        <LandingHero />

        <section id="featured-properties" className="mx-auto max-w-6xl px-6 py-28 md:py-36">
          <div className="text-center">
            <h2 className="font-serif text-3xl text-white md:text-4xl">Featured Properties</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#CCCCCC]">
              Explore our latest high-end investment opportunities
            </p>
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              href="/properties"
              className="text-sm font-medium text-[#C9A646] underline-offset-4 transition hover:underline"
            >
              View all listings
            </Link>
          </div>

          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {cards.map((c) => (
              <FeaturedPropertyCard
                key={c.id}
                id={c.id}
                title={c.title}
                city={c.city}
                priceLabel={c.priceLabel}
                beds={c.beds}
                baths={c.baths}
                sqft={c.sqft}
                imageUrl={c.imageUrl}
                detailHref={c.detailHref}
              />
            ))}
          </div>
        </section>

        <AIDealAnalyzerSection />
        <InvestorToolsSection />
        <BrokerWorkspacePreview />
        <InvestorPositioningSection />
        <PlatformAccessSection />
      </main>
      <Footer />
    </>
  );
}
