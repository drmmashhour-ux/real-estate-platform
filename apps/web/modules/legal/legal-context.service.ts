import type { MarketplacePersona, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { legalHubFlags } from "@/config/feature-flags";
import type {
  LegalDocumentItem,
  LegalHubActorType,
  LegalHubContext,
  LegalHubSignals,
  LegalRequirementState,
  LegalRequirementStatus,
} from "./legal.types";

const DOC_TERMS = LEGAL_DOCUMENT_TYPES.TERMS;
const DOC_PRIVACY = LEGAL_DOCUMENT_TYPES.PRIVACY;
const DOC_HOST = LEGAL_DOCUMENT_TYPES.BNHUB_HOST_AGREEMENT;
const DOC_BROKER = LEGAL_DOCUMENT_TYPES.BROKER_AGREEMENT;
const DOC_PLATFORM_ACK = LEGAL_DOCUMENT_TYPES.PLATFORM_ACKNOWLEDGMENT;

const ADMIN_ACTOR_ROLES: PlatformRole[] = [
  "ADMIN",
  "CONTENT_OPERATOR",
  "LISTING_OPERATOR",
  "OUTREACH_OPERATOR",
  "SUPPORT_AGENT",
];

function mapVerification(
  status: string | null | undefined,
): LegalHubSignals["identityVerificationStatus"] {
  const u = (status ?? "").toUpperCase();
  if (u === "VERIFIED") return "verified";
  if (u === "REJECTED") return "rejected";
  if (u === "PENDING" || u === "SUBMITTED") return "pending";
  if (!status) return "none";
  return "unknown";
}

export function resolveLegalActorFromPlatform(
  role: PlatformRole,
  persona: MarketplacePersona,
  counts: {
    shortTermListings: number;
    rentalLandlordListings: number;
    rentalTenantApplications: number;
    fsboOwned: number;
  },
): LegalHubActorType {
  if (ADMIN_ACTOR_ROLES.includes(role)) return "admin";
  if (role === "BROKER") return "broker";
  if (role === "HOST") return "host";
  if (role === "BUYER") return "buyer";
  if (role === "SELLER_DIRECT") return "seller";

  if (role === "USER" || role === "CLIENT" || role === "TESTER") {
    if (counts.rentalTenantApplications > 0) return "tenant";
    if (counts.rentalLandlordListings > 0) return "landlord";
    if (counts.shortTermListings > 0) return "host";
    if (counts.fsboOwned > 0 || persona === "SELLER_DIRECT") return "seller";
    if (persona === "BROKER") return "broker";
    if (persona === "BUYER") return "buyer";
    return "buyer";
  }

  if (counts.rentalTenantApplications > 0) return "tenant";
  if (counts.rentalLandlordListings > 0) return "landlord";
  if (counts.shortTermListings > 0) return "host";
  if (counts.fsboOwned > 0) return "seller";

  if (persona === "BROKER") return "broker";
  if (persona === "SELLER_DIRECT") return "seller";
  if (persona === "BUYER") return "buyer";

  return "buyer";
}

const ACTOR_VALUES: LegalHubActorType[] = [
  "buyer",
  "seller",
  "landlord",
  "tenant",
  "broker",
  "host",
  "admin",
];

export function parseLegalActorHint(raw: string | null | undefined): LegalHubActorType | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase() as LegalHubActorType;
  return ACTOR_VALUES.includes(v) ? v : undefined;
}

function inferRequirementStates(actor: LegalHubActorType, s: LegalHubSignals): LegalRequirementState[] {
  const st: LegalRequirementState[] = [];

  const privacyOk = s.privacyAccepted && s.termsAccepted;
  st.push({
    workflowType: "privacy_consent",
    requirementId: "privacy_policy",
    status: privacyOk ? "approved" : "not_started",
  });
  st.push({
    workflowType: "privacy_consent",
    requirementId: "marketing_prefs",
    status: privacyOk ? "waived" : "not_started",
  });

  const idSubmit: LegalRequirementStatus =
    s.identityVerificationStatus === "verified"
      ? "approved"
      : s.identityVerificationStatus === "pending"
        ? "submitted"
        : s.identityVerificationStatus === "rejected"
          ? "rejected"
          : "not_started";
  const idReview: LegalRequirementStatus =
    s.identityVerificationStatus === "verified"
      ? "approved"
      : s.identityVerificationStatus === "rejected"
        ? "rejected"
        : s.identityVerificationStatus === "pending"
          ? "in_progress"
          : "not_started";

  st.push({ workflowType: "identity_verification", requirementId: "submit_id", status: idSubmit });
  st.push({ workflowType: "identity_verification", requirementId: "review_outcome", status: idReview });

  st.push({
    workflowType: "payment_terms",
    requirementId: "terms_service",
    status: s.termsAccepted ? "approved" : "not_started",
  });
  st.push({
    workflowType: "payment_terms",
    requirementId: "payout_ready",
    status:
      actor === "host" || actor === "seller"
        ? s.stripeOnboardingComplete === true
          ? "approved"
          : "in_progress"
        : "waived",
  });

  st.push({
    workflowType: "seller_disclosure",
    requirementId: "accuracy_ack",
    status: s.sellerLegalAccuracyAccepted ? "approved" : "not_started",
  });
  st.push({
    workflowType: "seller_disclosure",
    requirementId: "material_updates",
    status: s.sellerDeclarationCompleted ? "submitted" : "not_started",
  });
  st.push({
    workflowType: "seller_disclosure",
    requirementId: "verification_gate",
    status: s.fsboVerificationRejected
      ? "rejected"
      : s.fsboPendingAdminReview
        ? "submitted"
        : s.hasPublishedOrSubmittedListing && !s.fsboVerificationRejected
          ? "approved"
          : "not_started",
  });

  st.push({
    workflowType: "short_term_rental_compliance",
    requirementId: "host_terms",
    status: s.hostingTermsAccepted ? "approved" : "not_started",
  });
  st.push({
    workflowType: "short_term_rental_compliance",
    requirementId: "identity_host",
    status: s.identityVerificationStatus === "verified" ? "approved" : idSubmit,
  });
  st.push({
    workflowType: "short_term_rental_compliance",
    requirementId: "property_rules_str",
    status: s.shortTermListingCount > 0 ? "in_progress" : "not_started",
  });

  st.push({
    workflowType: "lease_agreement",
    requirementId: "rental_terms",
    status: s.longTermRentalTermsAccepted ? "approved" : "not_started",
  });
  st.push({
    workflowType: "lease_agreement",
    requirementId: "lease_doc",
    status: s.leaseRecordPresent ? "approved" : actor === "landlord" || actor === "tenant" ? "not_started" : "waived",
  });
  st.push({
    workflowType: "lease_agreement",
    requirementId: "rules_alignment",
    status: s.leaseRecordPresent ? "submitted" : "not_started",
  });

  st.push({
    workflowType: "tenant_screening_consent",
    requirementId: "application_complete",
    status: s.rentalTenantApplicationCount > 0 ? "submitted" : "not_started",
  });
  st.push({
    workflowType: "tenant_screening_consent",
    requirementId: "consent_records",
    status: s.rentalApplicationLegalAccepted ? "approved" : "not_started",
  });

  st.push({
    workflowType: "broker_mandate",
    requirementId: "broker_agreement",
    status: s.brokerAgreementAccepted ? "approved" : "not_started",
  });
  st.push({
    workflowType: "broker_mandate",
    requirementId: "license_verification",
    status:
      s.brokerLicenseStatus === "verified"
        ? "approved"
        : s.brokerLicenseStatus === "rejected"
          ? "rejected"
          : s.brokerLicenseStatus === "pending"
            ? "submitted"
            : "not_started",
  });
  st.push({
    workflowType: "broker_mandate",
    requirementId: "listing_access_hygiene",
    status: actor === "broker" ? "in_progress" : "waived",
  });

  st.push({
    workflowType: "purchase_offer",
    requirementId: "identity_ready",
    status: s.identityVerificationStatus === "verified" ? "approved" : "not_started",
  });
  st.push({
    workflowType: "purchase_offer",
    requirementId: "terms_payment",
    status: s.termsAccepted ? "approved" : "not_started",
  });
  st.push({
    workflowType: "purchase_offer",
    requirementId: "broker_coordination",
    status: actor === "broker" ? "in_progress" : "waived",
  });

  st.push({
    workflowType: "property_rules",
    requirementId: "rules_published",
    status: s.shortTermListingCount > 0 || s.rentalLandlordListingCount > 0 ? "in_progress" : "not_started",
  });
  st.push({
    workflowType: "property_rules",
    requirementId: "updates_logged",
    status: "not_started",
  });

  st.push({
    workflowType: "risk_acknowledgement",
    requirementId: "platform_ack",
    status: s.platformAcknowledgmentAccepted ? "approved" : "not_started",
  });
  st.push({
    workflowType: "risk_acknowledgement",
    requirementId: "ai_tools",
    status: s.platformAcknowledgmentAccepted ? "submitted" : "not_started",
  });

  return st;
}

export async function buildLegalHubContextFromDb(params: {
  userId: string | null;
  locale: string;
  country: string;
  actorHint?: string | null;
  jurisdictionHint?: string | null;
}): Promise<LegalHubContext> {
  const missingDataWarnings: string[] = [];
  const flags = {
    legalHubV1: legalHubFlags.legalHubV1,
    legalHubDocumentsV1: legalHubFlags.legalHubDocumentsV1,
    legalHubRisksV1: legalHubFlags.legalHubRisksV1,
    legalHubAdminReviewV1: legalHubFlags.legalHubAdminReviewV1,
    legalUploadV1: legalHubFlags.legalUploadV1,
    legalReviewV1: legalHubFlags.legalReviewV1,
    legalWorkflowSubmissionV1: legalHubFlags.legalWorkflowSubmissionV1,
    legalEnforcementV1: legalHubFlags.legalEnforcementV1,
    legalReadinessV1: legalHubFlags.legalReadinessV1,
  };

  const agreements: LegalDocumentItem[] = [];
  let actorType: LegalHubActorType = parseLegalActorHint(params.actorHint) ?? "buyer";
  let jurisdiction = params.jurisdictionHint?.trim() || undefined;

  const emptySignals: LegalHubSignals = {
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
    sellerDeclarationCompleted: false,
    stripeOnboardingComplete: false,
    longTermRentalTermsAccepted: false,
    leaseRecordPresent: false,
    rentalApplicationLegalAccepted: false,
  };

  if (!params.userId) {
    missingDataWarnings.push("No authenticated user — actor may be overridden by query hint only.");
    return {
      actorType,
      jurisdiction,
      locale: params.locale,
      country: params.country,
      userId: null,
      requirementStates: inferRequirementStates(actorType, emptySignals),
      documents: agreements,
      signals: emptySignals,
      flags,
      missingDataWarnings,
      availabilityNotes: [
        "Listing-level document metadata and brokerage mandate depth are partially modeled — some steps stay manual.",
      ],
    };
  }

  try {
    const oid = params.userId;
    const fsboStatsPromise = Promise.all([
      prisma.fsboListing.count({
        where: { ownerId: oid, status: { in: ["ACTIVE", "PENDING_VERIFICATION", "SOLD"] } },
      }),
      prisma.fsboListing.count({ where: { ownerId: oid, status: "DRAFT" } }),
      prisma.fsboListing.count({ where: { ownerId: oid, moderationStatus: "REJECTED" } }),
      prisma.fsboListing.count({ where: { ownerId: oid, status: "PENDING_VERIFICATION" } }),
      prisma.fsboListing.count({
        where: { ownerId: oid, sellerDeclarationCompletedAt: { not: null } },
      }),
    ]).then(([publishedLike, draft, anyRejectedMod, withPendingVerification, declComplete]) => ({
      publishedLike,
      draft,
      anyRejectedMod,
      withPendingVerification,
      declComplete,
    }));

    const [
      user,
      userAgreements,
      identityRow,
      brokerRow,
      fsboStats,
      stCount,
      rentalLandlordCount,
      rentalTenantApps,
      leaseCount,
      rentalLegalAccepted,
      dealsCount,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: oid },
        select: {
          role: true,
          marketplacePersona: true,
          sellerLegalAccuracyAcceptedAt: true,
          stripeOnboardingComplete: true,
        },
      }),
      prisma.userAgreement.findMany({
        where: { userId: oid },
        select: { documentType: true, version: true, acceptedAt: true },
      }),
      prisma.identityVerification.findUnique({
        where: { userId: oid },
        select: { verificationStatus: true, updatedAt: true },
      }),
      prisma.brokerVerification.findUnique({
        where: { userId: oid },
        select: { verificationStatus: true, updatedAt: true },
      }),
      fsboStatsPromise,
      prisma.shortTermListing.count({ where: { ownerId: oid } }),
      prisma.rentalListing.count({ where: { landlordId: oid } }),
      prisma.rentalApplication.count({ where: { tenantId: oid } }),
      prisma.rentalLease.count({
        where: { OR: [{ landlordId: oid }, { tenantId: oid }] },
      }),
      prisma.rentalApplication.findFirst({
        where: { tenantId: oid, legalAcceptedAt: { not: null } },
        select: { legalAcceptedAt: true },
      }),
      prisma.realEstateTransaction
        .count({
          where: {
            OR: [{ buyerId: oid }, { sellerId: oid }, { brokerId: oid }],
            status: { notIn: ["cancelled", "completed", "CANCELLED", "CLOSED", "COMPLETED"] },
          },
        })
        .catch(() => {
          missingDataWarnings.push("Deal transaction counts skipped or unavailable.");
          return 0;
        }),
    ]);

    if (!user) {
      missingDataWarnings.push("User row missing — returning empty signals.");
      return {
        actorType,
        jurisdiction,
        locale: params.locale,
        country: params.country,
        userId: params.userId,
        requirementStates: inferRequirementStates(actorType, emptySignals),
        documents: agreements,
        signals: emptySignals,
        flags,
        missingDataWarnings,
      };
    }

    const agreementByType = new Map(userAgreements.map((a) => [a.documentType, a]));
    const termsA = agreementByType.get(DOC_TERMS);
    const privA = agreementByType.get(DOC_PRIVACY);
    const hostA = agreementByType.get(DOC_HOST);
    const brokerA = agreementByType.get(DOC_BROKER);

    let lastTerms: string | null | undefined;
    let lastPrivacy: string | null | undefined;
    if (termsA) lastTerms = termsA.acceptedAt.toISOString();
    if (privA) lastPrivacy = privA.acceptedAt.toISOString();

    const fsboOwned = await prisma.fsboListing.count({ where: { ownerId: oid } });

    const counts = {
      shortTermListings: stCount,
      rentalLandlordListings: rentalLandlordCount,
      rentalTenantApplications: rentalTenantApps,
      fsboOwned,
    };
    actorType =
      parseLegalActorHint(params.actorHint) ??
      resolveLegalActorFromPlatform(user.role, user.marketplacePersona, counts);

    if (!jurisdiction && (params.country ?? "").toLowerCase() === "ca") jurisdiction = "QC";

    const signals: LegalHubSignals = {
      identityVerificationStatus: identityRow ? mapVerification(identityRow.verificationStatus) : "none",
      termsAccepted: !!termsA,
      privacyAccepted: !!privA,
      hostingTermsAccepted: !!hostA,
      brokerAgreementAccepted: !!brokerA,
      platformAcknowledgmentAccepted: !!agreementByType.get(DOC_PLATFORM_ACK),
      sellerLegalAccuracyAccepted: !!user.sellerLegalAccuracyAcceptedAt,
      hasPublishedOrSubmittedListing: fsboStats.publishedLike > 0,
      hasDraftListing: fsboStats.draft > 0,
      fsboVerificationRejected: fsboStats.anyRejectedMod > 0,
      fsboPendingAdminReview: fsboStats.withPendingVerification > 0,
      shortTermListingCount: stCount,
      brokerLicenseStatus: brokerRow ? mapVerification(brokerRow.verificationStatus) : "none",
      rentalLandlordListingCount: rentalLandlordCount,
      rentalTenantApplicationCount: rentalTenantApps,
      activeOfferOrDealSignals: dealsCount > 0,
      lastTermsAcceptedAt: lastTerms,
      lastPrivacyAcceptedAt: lastPrivacy,
      sellerDeclarationCompleted: fsboStats.declComplete > 0,
      stripeOnboardingComplete: user.stripeOnboardingComplete === true,
      longTermRentalTermsAccepted: !!agreementByType.get(LEGAL_DOCUMENT_TYPES.BNHUB_LONG_TERM_RENTAL_AGREEMENT),
      leaseRecordPresent: leaseCount > 0,
      rentalApplicationLegalAccepted: !!rentalLegalAccepted?.legalAcceptedAt,
    };

    let availabilityNotes: string[] | undefined;
    if (!leaseCount) {
      missingDataWarnings.push(
        "Rental lease records may exist outside `RentalLease` — linkage is partial in v1.",
      );
      availabilityNotes = [
        "Long-term tenancy lease detection is limited to stored `RentalLease` rows in v1.",
      ];
    }

    pushAgreement(
      agreements,
      "terms",
      "Terms of Service",
      termsA ? "approved" : "not_started",
      lastTerms,
      "/legal/terms",
    );
    pushAgreement(
      agreements,
      "privacy",
      "Privacy Policy",
      privA ? "approved" : "not_started",
      lastPrivacy,
      "/legal/privacy",
    );
    pushAgreement(
      agreements,
      "host_agreement",
      "Hosting terms",
      hostA ? "approved" : "not_started",
      hostA?.acceptedAt.toISOString(),
      "/legal/hosting-terms",
    );
    pushAgreement(
      agreements,
      "broker_agreement",
      "Broker agreement",
      brokerA ? "approved" : "not_started",
      brokerA?.acceptedAt.toISOString(),
      "/legal/broker-agreement",
    );

    const requirementStates = inferRequirementStates(actorType, signals);

    return {
      actorType,
      jurisdiction,
      locale: params.locale,
      country: params.country,
      userId: params.userId,
      requirementStates,
      documents: agreements,
      signals,
      flags,
      missingDataWarnings,
      availabilityNotes,
    };
  } catch {
    missingDataWarnings.push("Partial legal context load — degraded empty-safe state.");
    return {
      actorType: parseLegalActorHint(params.actorHint) ?? "buyer",
      jurisdiction: params.jurisdictionHint?.trim() || undefined,
      locale: params.locale,
      country: params.country,
      userId: params.userId,
      requirementStates: inferRequirementStates(actorType, emptySignals),
      documents: [],
      signals: emptySignals,
      flags,
      missingDataWarnings,
    };
  }
}

function pushAgreement(
  list: LegalDocumentItem[],
  id: string,
  label: string,
  status: LegalRequirementStatus,
  updatedAt: string | null | undefined,
  href: string,
) {
  list.push({
    id,
    label,
    status,
    updatedAt: updatedAt ?? undefined,
    href,
  });
}
