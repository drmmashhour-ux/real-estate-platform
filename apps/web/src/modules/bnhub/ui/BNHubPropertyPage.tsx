import { prisma } from "@/lib/db";
import { generateListingTrustScore } from "@/src/modules/bnhub/application/trustService";
import { BNHubTrustLayer } from "@/components/bnhub/BNHubTrustLayer";
import { BookingCalendar } from "@/src/modules/bnhub/ui/BookingCalendar";
import { BookingFlow } from "@/src/modules/bnhub/ui/BookingFlow";
import { ReviewSection } from "@/src/modules/bnhub/ui/ReviewSection";
import { BNHubStarRatingDisplay } from "@/components/bnhub/BNHubStarRatingDisplay";
import type { ClassificationBreakdownCore } from "@/src/modules/bnhub-growth-engine/services/propertyClassificationService";
import { recomputePropertyClassificationForListing } from "@/src/modules/bnhub-growth-engine/services/propertyClassificationService";

export async function BNHubPropertyPage({ listingId }: { listingId: string }) {
  let listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      description: true,
      city: true,
      nightPriceCents: true,
      verificationStatus: true,
      bnhubPropertyClassification: true,
    },
  });
  if (!listing) {
    return <p className="text-sm text-red-400">Listing not found.</p>;
  }
  if (!listing.bnhubPropertyClassification) {
    await recomputePropertyClassificationForListing(listing.id);
    listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        nightPriceCents: true,
        verificationStatus: true,
        bnhubPropertyClassification: true,
      },
    });
    if (!listing) {
      return <p className="text-sm text-red-400">Listing not found.</p>;
    }
  }
  const trust = await generateListingTrustScore(listing.id);

  let classificationCore: ClassificationBreakdownCore | null = null;
  const raw = listing.bnhubPropertyClassification?.breakdownJson;
  if (raw && typeof raw === "object" && raw !== null && "overallScore" in raw) {
    classificationCore = raw as ClassificationBreakdownCore;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/10 bg-black/20 p-4">
        <h1 className="text-xl font-semibold text-white">{listing.title}</h1>
        <p className="mt-1 text-sm text-slate-400">{listing.city}</p>
        <div className="mt-3 max-w-md">
          <BNHubStarRatingDisplay breakdown={classificationCore} />
        </div>
        <p className="mt-2 text-sm text-slate-300">{listing.description || "No description."}</p>
        <p className="mt-2 text-sm text-slate-200">${(listing.nightPriceCents / 100).toFixed(2)} / night</p>
        <p className="mt-2 text-xs text-slate-400">
          Verification: <span className="text-slate-200">{listing.verificationStatus}</span> | Trust score:{" "}
          <span className="text-emerald-400">{trust.score}</span> ({trust.badge})
        </p>
      </section>
      <BNHubTrustLayer listingId={listing.id} />
      <BookingCalendar listingId={listing.id} />
      <BookingFlow listingId={listing.id} />
      <ReviewSection listingId={listing.id} />
    </div>
  );
}

