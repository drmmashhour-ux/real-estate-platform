import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PricingRecommendationCard } from "@/components/bnhub/quality/BnhubQualityKit";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/login");
  const { listingId } = await params;

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, title: true, nightPriceCents: true },
  });
  if (!listing || listing.ownerId !== userId) notFound();

  const prof = await prisma.bnhubDynamicPricingProfile.findUnique({ where: { listingId } });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-xl space-y-4">
        <Link href="/bnhub/host/pricing" className="text-sm text-emerald-400">
          ← Pricing hub
        </Link>
        <h1 className="text-xl font-semibold">{listing.title}</h1>
        <p className="text-sm text-slate-500">Your current listing price: ${(listing.nightPriceCents / 100).toFixed(2)} / night</p>
        {prof ? (
          <PricingRecommendationCard
            recommendedUsd={Number(prof.recommendedPrice).toFixed(2)}
            minUsd={Number(prof.minPrice).toFixed(2)}
            maxUsd={Number(prof.maxPrice).toFixed(2)}
            confidence={prof.confidenceScore}
            note="Adjust only if it fits your strategy — this is guidance, not a mandate."
          />
        ) : (
          <p className="text-sm text-slate-500">No recommendation yet. Update your listing to trigger a refresh.</p>
        )}
      </div>
    </main>
  );
}
