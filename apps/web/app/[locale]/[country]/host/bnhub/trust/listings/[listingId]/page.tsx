import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { BNHUB_TRUST_SAFE_COPY } from "@/modules/bnhub-trust/lib/safeCopy";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/bnhub/login");
  const { listingId } = await params;

  const listing = await prisma.shortTermListing.findFirst({
    where: { id: listingId, ownerId: userId },
    select: { id: true, title: true, city: true },
  });
  if (!listing) notFound();

  const [engine, addr, media] = await Promise.all([
    prisma.bnhubListingTrustRiskProfile.findUnique({ where: { listingId } }),
    prisma.bnhubAddressVerification.findUnique({ where: { listingId } }),
    prisma.bnhubMediaTrustValidation.findUnique({ where: { listingId } }),
  ]);

  const addressOk =
    addr &&
    addr.geocodeStatus !== "FAILED" &&
    addr.geocodeStatus !== "NEEDS_REVIEW";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-xl space-y-6">
        <Link href="/host/bnhub/trust" className="text-sm text-emerald-400">
          ← Trust overview
        </Link>
        <h1 className="text-xl font-semibold">{listing.title}</h1>
        <p className="text-sm text-slate-500">{listing.city}</p>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
          <h2 className="font-medium text-slate-200">Trust status</h2>
          <p className="mt-2 text-slate-400">
            {engine?.trustStatus
              ? engine.trustStatus === "TRUSTED"
                ? "No additional review is required right now."
                : BNHUB_TRUST_SAFE_COPY.reviewRequired
              : BNHUB_TRUST_SAFE_COPY.additionalValidationRequired}
          </p>
          {engine?.payoutRestrictionStatus && engine.payoutRestrictionStatus !== "NONE" ? (
            <p className="mt-2 text-slate-500">{BNHUB_TRUST_SAFE_COPY.payoutHoldGeneric}</p>
          ) : null}
          {engine?.promotionEligibilityStatus === "BLOCKED" || engine?.promotionEligibilityStatus === "REVIEW_REQUIRED" ? (
            <p className="mt-2 text-slate-500">{BNHUB_TRUST_SAFE_COPY.promotionBlocked}</p>
          ) : null}
        </section>

        <section className="rounded-xl border border-slate-800 p-4 text-sm text-slate-400">
          <h2 className="font-medium text-slate-200">Address validation</h2>
          <p className="mt-2">
            {!addr
              ? BNHUB_TRUST_SAFE_COPY.additionalValidationRequired
              : addressOk
                ? "Your address has been processed."
                : BNHUB_TRUST_SAFE_COPY.addressNeedsReview}
          </p>
        </section>

        <section className="rounded-xl border border-slate-800 p-4 text-sm text-slate-400">
          <h2 className="font-medium text-slate-200">Photos</h2>
          <p className="mt-2">
            {media?.exteriorPhotoPresent ? "Exterior or building imagery is present." : BNHUB_TRUST_SAFE_COPY.missingExteriorPhoto}
          </p>
        </section>
      </div>
    </main>
  );
}
