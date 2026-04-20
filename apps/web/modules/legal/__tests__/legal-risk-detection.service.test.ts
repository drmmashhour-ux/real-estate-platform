import { describe, expect, it } from "vitest";
import { detectLegalRisks } from "../legal-risk-detection.service";
import type { LegalHubContext } from "../legal.types";

function baseCtx(): LegalHubContext {
  return {
    actorType: "buyer",
    locale: "en",
    country: "ca",
    userId: "u1",
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
      legalHubV1: true,
      legalHubDocumentsV1: true,
      legalHubRisksV1: true,
      legalHubAdminReviewV1: false,
      legalUploadV1: false,
      legalReviewV1: false,
      legalWorkflowSubmissionV1: false,
      legalEnforcementV1: false,
      legalReadinessV1: false,
    },
    missingDataWarnings: [],
  };
}

describe("detectLegalRisks", () => {
  it("does not throw on minimal context", () => {
    expect(() => detectLegalRisks(baseCtx())).not.toThrow();
  });

  it("flags missing privacy/terms as critical signal", () => {
    const risks = detectLegalRisks(baseCtx());
    expect(risks.some((r) => r.id.includes("privacy_consent"))).toBe(true);
  });

  it("never throws when requirement rejected entries exist", () => {
    const ctx = baseCtx();
    ctx.requirementStates.push({
      workflowType: "identity_verification",
      requirementId: "submit_id",
      status: "rejected",
    });
    expect(() => detectLegalRisks(ctx)).not.toThrow();
  });
});
