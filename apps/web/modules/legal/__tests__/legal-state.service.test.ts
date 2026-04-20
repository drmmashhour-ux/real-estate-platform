import { describe, expect, it } from "vitest";
import { legalHubFlags } from "@/config/feature-flags";
import { buildLegalHubSummary } from "../legal-state.service";
import type { LegalHubActorType, LegalHubContext } from "../legal.types";

function emptyCtx(actor: LegalHubActorType): LegalHubContext {
  return {
    actorType: actor,
    jurisdiction: "QC",
    locale: "en",
    country: "ca",
    userId: null,
    requirementStates: [],
    documents: [],
    signals: {
      identityVerificationStatus: "none",
      termsAccepted: false,
      privacyAccepted: false,
      hostingTermsAccepted: false,
      brokerAgreementAccepted: false,
      platformAcknowledgmentAccepted: false,
      sellerLegalAccuracyAccepted: false,
      hasPublishedOrSubmittedListing: false,
      hasDraftListing: false,
      fsboVerificationRejected: false,
      fsboPendingAdminReview: false,
      shortTermListingCount: 0,
      brokerLicenseStatus: "none",
      rentalLandlordListingCount: 0,
      rentalTenantApplicationCount: 0,
      activeOfferOrDealSignals: false,
      lastTermsAcceptedAt: null,
      lastPrivacyAcceptedAt: null,
    },
    flags: {
      legalHubV1: legalHubFlags.legalHubV1,
      legalHubDocumentsV1: legalHubFlags.legalHubDocumentsV1,
      legalHubRisksV1: legalHubFlags.legalHubRisksV1,
      legalHubAdminReviewV1: legalHubFlags.legalHubAdminReviewV1,
      legalUploadV1: legalHubFlags.legalUploadV1,
      legalReviewV1: legalHubFlags.legalReviewV1,
      legalWorkflowSubmissionV1: legalHubFlags.legalWorkflowSubmissionV1,
      legalEnforcementV1: legalHubFlags.legalEnforcementV1,
      legalReadinessV1: legalHubFlags.legalReadinessV1,
    },
    missingDataWarnings: [],
  };
}

describe("buildLegalHubSummary", () => {
  it("returns safe summary with disclaimers for empty buyer context", () => {
    const s = buildLegalHubSummary(emptyCtx("buyer"));
    expect(s.disclaimerLines.length).toBeGreaterThan(0);
    expect(s.disclaimerItems.length).toBeGreaterThan(0);
    expect(s.portfolio.totalWorkflows).toBeGreaterThan(0);
    expect(() => buildLegalHubSummary(emptyCtx("seller"))).not.toThrow();
  });

  it("documents empty when documents flag unavailable in context mock", () => {
    const ctx = emptyCtx("broker");
    ctx.flags.legalHubDocumentsV1 = false;
    const s = buildLegalHubSummary(ctx);
    expect(s.documents).toEqual([]);
  });
});
