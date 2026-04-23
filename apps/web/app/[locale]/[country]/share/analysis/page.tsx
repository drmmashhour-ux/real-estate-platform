import { notFound } from "next/navigation";
import { prisma } from "@repo/db";
import { verifyListingAnalysisShareToken } from "@/lib/share/listing-analysis-share";
import { ShareAnalysisPublicCard } from "@/components/share/ShareAnalysisPublicCard";
import { ShareAnalysisViewTracker } from "@/components/share/ShareAnalysisViewTracker";

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<{ t?: string }> };

/**
 * Public, link-only view of listing analysis summary (no PII; estimates only).
 * Opened via /share/analysis?t=... from POST /api/fsbo-listings/[id]/share-analysis
 */
export default async function ShareAnalysisPage({ searchParams }: Props) {
  const { t } = (await searchParams) ?? {};
  if (!t?.trim()) notFound();

  const payload = verifyListingAnalysisShareToken(t);
  if (!payload) notFound();

  const listing = await prisma.fsboListing.findFirst({
    where: { id: payload.listingId, ownerId: payload.ownerId },
    select: {
      id: true,
      city: true,
      title: true,
      trustScore: true,
      status: true,
    },
  });
  if (!listing) notFound();

  const deal = await prisma.dealAnalysis.findFirst({
    where: { propertyId: listing.id },
    orderBy: { updatedAt: "desc" },
    select: {
      investmentScore: true,
      riskScore: true,
      recommendation: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#0D0D0D] px-4 py-12 text-slate-100">
      <ShareAnalysisViewTracker listingId={listing.id} />
      <div className="mx-auto max-w-lg">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">LECIPM</p>
        <h1 className="mt-2 text-center text-xl font-semibold text-white">Listing analysis snapshot</h1>
        <p className="mt-2 text-center text-xs text-slate-500">
          Estimates only — not an appraisal or investment advice. Recipient sees a summary, not full listing details.
        </p>
        <div className="mt-8">
          <ShareAnalysisPublicCard
            city={listing.city}
            titleHint={listing.title.slice(0, 80) + (listing.title.length > 80 ? "…" : "")}
            trustScore={listing.trustScore}
            dealScore={deal?.investmentScore ?? null}
            recommendation={deal?.recommendation ?? null}
            riskScore={deal?.riskScore ?? null}
          />
        </div>
      </div>
    </main>
  );
}
