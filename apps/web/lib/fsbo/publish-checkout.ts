import { prisma } from "@/lib/db";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe";
import { getFsboPlanPublishPriceCents, parseFsboPublishPlan } from "@/lib/fsbo/constants";
import { recordPlatformEvent } from "@/lib/observability";
import { assertSellerHubSubmitReady } from "@/lib/fsbo/seller-hub-validation";
import { persistSellerDeclarationAiReview } from "@/lib/fsbo/seller-declaration-ai-review";
import { ensureFsboListingDocumentSlots } from "@/lib/fsbo/seller-hub-seed-documents";
import { ensureFsboListingListingCode } from "@/lib/fsbo/ensure-fsbo-listing-code";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { assertListingPublishTrustGate } from "@/lib/trustgraph/application/integrations/listingPublishIntegration";

export type FsboPublishCheckoutTrustGraphError = {
  blocking: Array<{ ruleCode: string; message: string }>;
  warnings: Array<{ ruleCode: string; message: string }>;
};

export type FsboPublishCheckoutResult =
  | { ok: true; url: string }
  | { ok: true; freePublish: true }
  | { ok: false; error: string; status: number; trustGraph?: FsboPublishCheckoutTrustGraphError };

/**
 * Start Stripe Checkout for publishing a draft FSBO listing, or free publish in dev when allowed.
 */
export async function startFsboListingPublishCheckout(
  userId: string,
  listingId: string,
  planInput: unknown
): Promise<FsboPublishCheckoutResult> {
  const plan = parseFsboPublishPlan(planInput);

  await ensureFsboListingDocumentSlots(listingId);
  await prisma.$transaction(async (tx) => {
    await ensureFsboListingListingCode(tx, listingId);
  });

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    include: { documents: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return { ok: false, error: "Not found", status: 404 };
  }
  if (listing.status !== "DRAFT") {
    return { ok: false, error: "Only draft listings can be published", status: 409 };
  }

  const gate = await assertSellerHubSubmitReady(listing, listing.documents);
  if (!gate.ok) {
    return { ok: false, error: gate.errors.join(" · "), status: 400 };
  }

  await persistSellerDeclarationAiReview(listingId);

  if (isTrustGraphEnabled()) {
    const trustGate = await assertListingPublishTrustGate({
      listingId,
      actorUserId: userId,
      publishPlan: plan,
    });
    if (!trustGate.ok) {
      return {
        ok: false,
        error: trustGate.userMessage,
        status: 403,
        trustGraph: {
          blocking: trustGate.blocking.map((b) => ({ ruleCode: b.ruleCode, message: b.message })),
          warnings: trustGate.warnings.map((w) => ({ ruleCode: w.ruleCode, message: w.message })),
        },
      };
    }
  }

  if (enforceableContractsRequired()) {
    const signed = await hasActiveEnforceableContract(userId, ENFORCEABLE_CONTRACT_TYPES.SELLER, {
      fsboListingId: listingId,
    });
    if (!signed) {
      return {
        ok: false,
        error:
          "Sign the seller listing agreement before publishing. Use the legal contract step on your listing (or /api/legal/enforceable-contract/sign with kind=seller).",
        status: 403,
      };
    }
  }

  await prisma.fsboListing.update({
    where: { id: listingId },
    data: { publishPlan: plan },
  });

  const allowUnpaid = process.env.FSBO_ALLOW_UNPAID_PUBLISH === "true";
  if (!isStripeConfigured()) {
    if (allowUnpaid) {
      await prisma.fsboListing.update({
        where: { id: listingId },
        data: {
          status: "ACTIVE",
          moderationStatus: "APPROVED",
          rejectReason: null,
          publishPlan: plan,
          publishPriceCents: 0,
          paidPublishAt: new Date(),
          featuredUntil: plan === "premium" ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) : null,
        },
      });
      void recordPlatformEvent({
        eventType: "listing_activated",
        sourceModule: "fsbo",
        entityType: "FSBO_LISTING",
        entityId: listingId,
        payload: { publishPlan: plan, freePublish: true },
      }).catch(() => {});
      return { ok: true, freePublish: true };
    }
    return {
      ok: false,
      error:
        "Payments are not configured. Set Stripe keys or FSBO_ALLOW_UNPAID_PUBLISH=true for dev.",
      status: 503,
    };
  }

  const amountCents = getFsboPlanPublishPriceCents(plan);
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";
  const result = await createCheckoutSession({
    successUrl: `${base}/dashboard/fsbo?fsboPaid=1`,
    cancelUrl: `${base}/sell/create?id=${encodeURIComponent(listingId)}`,
    amountCents,
    paymentType: "fsbo_publish",
    userId,
    fsboListingId: listingId,
    fsboPlan: plan,
    description:
      plan === "premium"
        ? "FSBO — featured listing publish on LECIPM"
        : "FSBO — standard listing publish on LECIPM",
  });

  if ("error" in result) {
    return { ok: false, error: result.error, status: 400 };
  }
  return { ok: true, url: result.url };
}
