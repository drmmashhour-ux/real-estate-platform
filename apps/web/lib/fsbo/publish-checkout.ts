import { prisma } from "@/lib/db";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe";
import { getFsboPlanPublishPriceCents, parseFsboPublishPlan } from "@/lib/fsbo/constants";
import { recordPlatformEvent } from "@/lib/observability";
import { assertSellerHubSubmitReady } from "@/lib/fsbo/seller-hub-validation";
import { persistSellerDeclarationAiReview } from "@/lib/fsbo/seller-declaration-ai-review";
import { ensureFsboListingDocumentSlots } from "@/lib/fsbo/seller-hub-seed-documents";
import { ensureFsboListingListingCode } from "@/lib/fsbo/ensure-fsbo-listing-code";
import { syncFsboListingExpiryState } from "@/lib/fsbo/listing-expiry";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { assertListingPublishTrustGate } from "@/lib/trustgraph/application/integrations/listingPublishIntegration";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { notifyFsboListingActivatedIfNeeded } from "@/lib/listing-lifecycle/notify-fsbo-listing-activated";
import { complianceFlags } from "@/config/feature-flags";
import { evaluateListingPublishComplianceDecision } from "@/modules/legal/compliance/listing-publish-compliance.service";
import { recordEventSafe } from "@/modules/events/event-helpers";
import { recordEvent } from "@/modules/events/event.service";
import {
  assertMandatoryBrokerDisclosurePresent,
  MandatoryBrokerDisclosureError,
} from "@/lib/compliance/oaciq/broker-mandatory-disclosure.service";
import {
  assertBrokerProfessionalInsuranceActiveOrThrow,
  BrokerProfessionalInsuranceError,
} from "@/lib/compliance/oaciq/broker-professional-insurance.service";

export type FsboPublishCheckoutTrustGraphError = {
  blocking: Array<{ ruleCode: string; message: string }>;
  warnings: Array<{ ruleCode: string; message: string }>;
};

export type FsboPublishCheckoutResult =
  | { ok: true; url: string }
  | { ok: true; freePublish: true }
  | {
      ok: false;
      error: "COMPLIANCE_BLOCK" | string;
      status: number;
      trustGraph?: FsboPublishCheckoutTrustGraphError;
      compliance?: {
        reasons: string[];
        blockingIssues: string[];
        readinessScore: number;
        legalRiskScore?: number;
        reviewRequired?: boolean;
        adminReasons?: string[];
      };
    };

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
    include: { documents: true, sellerSupportingDocuments: { select: { category: true, status: true, declarationSectionKey: true } } },
  });
  if (!listing || listing.ownerId !== userId) {
    return { ok: false, error: "Not found", status: 404 };
  }
  if (listing.status !== "DRAFT") {
    return { ok: false, error: "Only draft listings can be published", status: 409 };
  }

  const gate = await assertSellerHubSubmitReady(listing, listing.documents, listing.sellerSupportingDocuments);
  if (!gate.ok) {
    return { ok: false, error: gate.errors.join(" · "), status: 400 };
  }

  const publishGateEnabled =
    complianceFlags.quebecComplianceV1 &&
    (complianceFlags.complianceAutoBlockV1 || complianceFlags.listingPrepublishAutoBlockV1);

  const usePhase8Evaluator =
    complianceFlags.quebecListingComplianceV1 ||
    complianceFlags.listingPrepublishAutoBlockV1 ||
    complianceFlags.propertyLegalRiskScoreV1;

  if (publishGateEnabled) {
    const { loadQuebecComplianceEvaluatorInput, shouldApplyQuebecComplianceForListing } = await import(
      "@/modules/legal/compliance/listing-publish-compliance.service",
    );

    const inp = await loadQuebecComplianceEvaluatorInput(listingId);
    const applies =
      inp !== null &&
      shouldApplyQuebecComplianceForListing({ country: inp.listing.country ?? "", region: inp.listing.region ?? "" });

    if (applies) {
      if (usePhase8Evaluator) {
        const { evaluateListingPrepublishBlock, buildPrepublishBlockResponse } = await import(
          "@/modules/legal/compliance/prepublish-auto-block.service",
        );
        const ev = evaluateListingPrepublishBlock({ listingId, evaluatorInput: inp });

        if (complianceFlags.propertyLegalRiskScoreV1 && ev.legalRisk != null) {
          await prisma.fsboListing
            .update({
              where: { id: listingId },
              data: { riskScore: ev.legalRisk.score },
            })
            .catch(() => null);
        }

        await recordEventSafe(async () =>
          recordEvent({
            entityType: "listing",
            entityId: listingId,
            eventType: "quebec_compliance_evaluated",
            actorId: userId,
            actorType: "seller",
            metadata: {
              readinessScore: ev.readinessScore,
              allowed: ev.allowed,
              phase: "listing_compliance_v1",
            },
          }),
        );

        if (ev.legalRisk != null) {
          await recordEventSafe(async () =>
            recordEvent({
              entityType: "listing",
              entityId: listingId,
              eventType: "property_legal_risk_scored",
              actorId: userId,
              actorType: "seller",
              metadata: {
                score: ev.legalRisk.score,
                level: ev.legalRisk.level,
                blocking: ev.legalRisk.blocking,
              },
            }),
          );
        }

        if (!ev.allowed) {
          const riskBlock =
            complianceFlags.propertyLegalRiskScoreV1 === true &&
            ev.legalRisk != null &&
            (ev.legalRisk.blocking === true || ev.legalRisk.score >= 80);

          await recordEventSafe(async () =>
            recordEvent({
              entityType: "listing",
              entityId: listingId,
              eventType:
                riskBlock === true ? "listing_publish_blocked_legal_risk" : "listing_publish_blocked_compliance",
              actorId: userId,
              actorType: "seller",
              metadata: {
                readinessScore: ev.readinessScore,
                legalRiskScore: ev.legalRiskScore,
                blockingIssues: ev.blockingIssues.slice(0, 24),
              },
            }),
          );

          const payload = buildPrepublishBlockResponse(ev);
          return {
            ok: false,
            error: "COMPLIANCE_BLOCK",
            status: 403,
            compliance: {
              reasons: payload.reasons,
              blockingIssues: payload.blockingIssues,
              readinessScore: payload.readinessScore,
              legalRiskScore: payload.legalRiskScore,
              reviewRequired: payload.reviewRequired,
              adminReasons: payload.adminReasons,
            },
          };
        }

        await recordEventSafe(async () =>
          recordEvent({
            entityType: "listing",
            entityId: listingId,
            eventType: "listing_publish_allowed_compliance",
            actorId: userId,
            actorType: "seller",
            metadata: { readinessScore: ev.readinessScore, legalRiskScore: ev.legalRiskScore },
          }),
        );
      } else {
        const qc = await evaluateListingPublishComplianceDecision(listingId);
        if (qc.apply && !qc.decision.allowed) {
          await recordEventSafe(async () =>
            recordEvent({
              entityType: "listing",
              entityId: listingId,
              eventType: "listing_publish_blocked_compliance",
              actorId: userId,
              actorType: "seller",
              metadata: {
                readinessScore: qc.decision.readinessScore,
                blockingIssues: qc.decision.blockingIssues,
              },
            }),
          );
          await recordEventSafe(async () =>
            recordEvent({
              entityType: "listing",
              entityId: listingId,
              eventType: "quebec_compliance_evaluated",
              actorId: userId,
              actorType: "seller",
              metadata: {
                readinessScore: qc.decision.readinessScore,
                allowed: false,
                phase: "legacy_publish_gate",
              },
            }),
          );
          return {
            ok: false,
            error: "COMPLIANCE_BLOCK",
            status: 403,
            compliance: {
              reasons: qc.decision.reasons,
              blockingIssues: qc.decision.blockingIssues,
              readinessScore: qc.decision.readinessScore,
            },
          };
        }
        if (qc.apply && qc.decision.allowed) {
          await recordEventSafe(async () =>
            recordEvent({
              entityType: "listing",
              entityId: listingId,
              eventType: "listing_publish_allowed_compliance",
              actorId: userId,
              actorType: "seller",
              metadata: { readinessScore: qc.decision.readinessScore },
            }),
          );
          await recordEventSafe(async () =>
            recordEvent({
              entityType: "listing",
              entityId: listingId,
              eventType: "quebec_compliance_evaluated",
              actorId: userId,
              actorType: "seller",
              metadata: {
                readinessScore: qc.decision.readinessScore,
                allowed: true,
                phase: "legacy_publish_gate",
              },
            }),
          );
        }
      }
    }
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

  if (listing.listingOwnerType === "BROKER") {
    try {
      await assertMandatoryBrokerDisclosurePresent({
        brokerId: listing.ownerId,
        fsboListingId: listingId,
        blockContext: "fsbo_broker_publish",
      });
    } catch (e) {
      if (e instanceof MandatoryBrokerDisclosureError) {
        return { ok: false, error: e.message, status: 403 };
      }
      throw e;
    }
    try {
      await assertBrokerProfessionalInsuranceActiveOrThrow(listing.ownerId, "fsbo_broker_publish");
    } catch (e) {
      if (e instanceof BrokerProfessionalInsuranceError) {
        return { ok: false, error: e.message, status: 403 };
      }
      throw e;
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
      await syncFsboListingExpiryState(listingId, { sendReminder: false }).catch(() => null);
      void notifyFsboListingActivatedIfNeeded(listingId).catch(() => null);
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
  const base = getPublicAppUrl();
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
