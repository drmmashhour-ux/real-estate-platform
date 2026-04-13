import { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { generateListingTrustScore } from "@/src/modules/bnhub/application/trustService";
import { generateSmartPrice } from "@/lib/bnhub/smart-pricing";
import { generateBookingConfidence } from "@/lib/bnhub/booking-confidence";
import { ConfidenceScoreCard } from "./ConfidenceScoreCard";
import { SmartPricingCard } from "./SmartPricingCard";

function TrustBadge({ label, tone }: { label: string; tone: "emerald" | "amber" | "slate" }) {
  const ring =
    tone === "emerald"
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
      : tone === "amber"
        ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
        : "border-slate-600 bg-slate-800/60 text-slate-300";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ring}`}>
      {label}
    </span>
  );
}

/**
 * Listing detail trust strip: badges, smart price, and booking confidence for guests.
 */
export async function BNHubTrustLayer({ listingId }: { listingId: string }) {
  const guestId = await getGuestId().catch(() => null);

  const [listing, trust, smart, confidence] = await Promise.all([
    prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: {
        nightPriceCents: true,
        verificationStatus: true,
        ownerId: true,
        reviews: { select: { propertyRating: true } },
        verificationFraudAlerts: { select: { id: true } },
      },
    }),
    generateListingTrustScore(listingId),
    generateSmartPrice(listingId).catch(() => null),
    generateBookingConfidence(listingId, guestId).catch(() => null),
  ]);

  if (!listing) return null;

  const hostProfile = await prisma.bnhubHostProfile.findUnique({
    where: { userId: listing.ownerId },
    select: { verificationStatus: true, trustScore: true },
  });

  const ratings = listing.reviews.map((r) => r.propertyRating);
  const reviewAvg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  const badges: { label: string; tone: "emerald" | "amber" | "slate" }[] = [];
  if (listing.verificationStatus === VerificationStatus.VERIFIED) {
    badges.push({ label: "Verified listing", tone: "emerald" });
  }
  if (hostProfile?.verificationStatus === "verified") {
    badges.push({ label: "Verified host", tone: "emerald" });
  }
  if (reviewAvg != null && reviewAvg >= 4.5 && ratings.length >= 3) {
    badges.push({ label: "Top rated", tone: "emerald" });
  } else if (reviewAvg != null && reviewAvg >= 4.0 && ratings.length >= 1) {
    badges.push({ label: "Well reviewed", tone: "amber" });
  }
  const fraudSignals = listing.verificationFraudAlerts.length;
  const hostTrust = hostProfile?.trustScore ?? 0;
  if (fraudSignals === 0 && hostTrust >= 40) {
    badges.push({ label: "Low risk signals", tone: "slate" });
  }

  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">BNHUB trust layer</p>
        <p className="mt-1 text-sm text-slate-400">
          Transparency for guests: verification, reviews, and pricing context in one place.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <TrustBadge key={`${b.label}-${i}`} label={b.label} tone={b.tone} />
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Listing trust score: <span className="font-medium text-emerald-400">{trust.score}</span> ({trust.badge})
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {smart ? (
          <SmartPricingCard
            currentCents={listing.nightPriceCents}
            recommendedCents={smart.recommendedPriceCents}
            confidence={smart.confidence}
            demandLevel={smart.demandLevel}
            marketAvgCents={smart.marketAvgCents}
          />
        ) : null}
        {confidence ? (
          <ConfidenceScoreCard
            level={confidence.level}
            score={confidence.score}
            reasons={confidence.reasons}
            guestHint={confidence.guestTrustHint}
          />
        ) : null}
      </div>

      <p className="text-xs text-slate-500">
        Paid stays include the BNHUB guarantee (see your booking after confirmation). If something does not match the
        listing, you can start a claim from the booking page.
      </p>
    </section>
  );
}
