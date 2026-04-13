import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { BnhubFraudFlagStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { StarRatingBadge, LuxuryTierBadge, TrustScoreCard, FraudRiskBadge } from "@/components/bnhub/quality/BnhubQualityKit";
import { adminRecomputeBnhubEngines } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const { listingId } = await params;

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, city: true },
  });
  if (!listing) notFound();

  const [cls, tier, trust, flags, pricing, fraudCount, engine, addr, media, locPol, v2Flags] = await Promise.all([
    prisma.bnhubPropertyClassification.findUnique({ where: { listingId } }),
    prisma.bnhubLuxuryTier.findUnique({ where: { listingId } }),
    prisma.bnhubTrustProfile.findUnique({ where: { listingId } }),
    prisma.bnhubFraudFlag.findMany({ where: { listingId }, orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.bnhubDynamicPricingProfile.findUnique({ where: { listingId } }),
    prisma.bnhubFraudFlag.count({
      where: { listingId, status: { in: [BnhubFraudFlagStatus.OPEN, BnhubFraudFlagStatus.UNDER_REVIEW] } },
    }),
    prisma.bnhubListingTrustRiskProfile.findUnique({ where: { listingId } }),
    prisma.bnhubAddressVerification.findUnique({ where: { listingId } }),
    prisma.bnhubMediaTrustValidation.findUnique({ where: { listingId } }),
    prisma.bnhubLocationPolicyProfile.findUnique({ where: { listingId } }),
    prisma.bnhubTrustRiskFlag.findMany({ where: { listingId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <HubLayout title="Listing trust" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="max-w-3xl space-y-4 text-white">
        <Link href="/admin/bnhub/trust" className="text-sm text-amber-400">
          ← Queue
        </Link>
        <h1 className="text-xl font-bold">{listing.title}</h1>
        <p className="text-sm text-zinc-500">{listing.city}</p>
        <form action={adminRecomputeBnhubEngines.bind(null, listingId)}>
          <button
            type="submit"
            className="rounded-lg border border-amber-600/50 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-950/40"
          >
            Recompute engines
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {cls ? <StarRatingBadge stars={cls.starRating} label={`${cls.overallScore}/100`} /> : null}
          {tier ? <LuxuryTierBadge code={tier.tierCode} /> : null}
        </div>

        {trust ? (
          <TrustScoreCard
            trustScore={trust.trustScore}
            riskLevel={trust.overallRiskLevel}
            safeMessage="Admin view — evidence JSON stored server-side; guests see only curated messaging."
          />
        ) : (
          <p className="text-sm text-zinc-500">No trust profile row yet.</p>
        )}

        {engine ? (
          <div className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-300">
            <h2 className="font-semibold text-amber-200">Trust engine profile</h2>
            <p className="mt-2 text-xs text-zinc-500">
              trust {engine.trustStatus} · risk {engine.overallRiskLevel} · payout {engine.payoutRestrictionStatus} ·
              promo {engine.promotionEligibilityStatus}
            </p>
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-zinc-950 p-2 text-xs text-zinc-500">
              {JSON.stringify(engine.breakdownJson, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No engine risk row — run recompute.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {addr ? (
            <div className="rounded-xl border border-zinc-800 p-4 text-xs text-zinc-400">
              <p className="font-semibold text-zinc-200">Address</p>
              <p className="mt-1">status {addr.geocodeStatus}</p>
              <p className="mt-1 line-clamp-3">{addr.normalizedAddress ?? addr.rawAddress}</p>
              <p className="mt-1 text-zinc-600">mismatch flags: {JSON.stringify(addr.mismatchFlagsJson)}</p>
            </div>
          ) : null}
          {media ? (
            <div className="rounded-xl border border-zinc-800 p-4 text-xs text-zinc-400">
              <p className="font-semibold text-zinc-200">Media</p>
              <p className="mt-1">exterior photo: {media.exteriorPhotoPresent ? "yes" : "no"}</p>
              <p className="mt-1">street view compare: {media.streetviewComparisonStatus}</p>
            </div>
          ) : null}
          {locPol ? (
            <div className="rounded-xl border border-zinc-800 p-4 text-xs text-zinc-400 sm:col-span-2">
              <p className="font-semibold text-zinc-200">Location policy</p>
              <p className="mt-1">
                policy {locPol.policyStatus} · zone {locPol.zonePolicyResult} · access {locPol.accessSafetyResult}
              </p>
              <pre className="mt-2 max-h-32 overflow-auto rounded bg-zinc-950 p-2 text-zinc-600">
                {JSON.stringify(locPol.evidenceJson, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>

        {v2Flags.length > 0 ? (
          <div className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-300">Engine flags</h2>
            <ul className="mt-2 space-y-2 text-xs text-zinc-400">
              {v2Flags.map((f) => (
                <li key={f.id} className="border-b border-zinc-800 pb-2">
                  <FraudRiskBadge level={f.severity} /> {f.flagType} · {f.flagStatus}
                  <p className="mt-1 text-zinc-500">{f.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-xl border border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-zinc-300">Fraud flags ({fraudCount} open)</h2>
          <ul className="mt-2 space-y-2 text-xs text-zinc-400">
            {flags.map((f) => (
              <li key={f.id} className="border-b border-zinc-800 pb-2">
                <FraudRiskBadge level={f.severity} /> {f.flagType} · {f.status}
                <p className="mt-1 text-zinc-500">{f.summary}</p>
              </li>
            ))}
          </ul>
        </div>

        {pricing ? (
          <div className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-300">
            <p className="font-semibold text-emerald-400">Dynamic pricing (internal)</p>
            <p>Recommended ${Number(pricing.recommendedPrice).toFixed(2)} · confidence {pricing.confidenceScore}%</p>
          </div>
        ) : null}
      </div>
    </HubLayout>
  );
}
