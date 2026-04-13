/**
 * Legal document types – reusable across BNHUB and future hubs.
 */
export const LEGAL_DOCUMENT_TYPES = {
  TERMS: "terms",
  PRIVACY: "privacy",
  COOKIES: "cookies",
  DISCLAIMER: "disclaimer",
  BNHUB_HOST_AGREEMENT: "host_agreement",
  /** Long-term (monthly) landlord–tenant terms; public legal page + optional admin CMS. */
  BNHUB_LONG_TERM_RENTAL_AGREEMENT: "bnhub_long_term_rental_agreement",
  /** BNHUB brokers: leads, commission splits, referral fees; public legal page + optional admin CMS. */
  BNHUB_BROKER_COLLABORATION_AGREEMENT: "bnhub_broker_collaboration_agreement",
  BNHUB_GUEST_POLICY: "guest_policy",
  BROKER_AGREEMENT: "broker_agreement",
  PLATFORM_USAGE: "platform_usage",
  /** Facilitator role, licensing, disclosures, AI/calculator disclaimers; public legal + optional admin CMS. */
  PLATFORM_ACKNOWLEDGMENT: "platform_acknowledgment",
  /** Logged-in users: intermediary role, accuracy, activity logging (dashboard gate). */
  PLATFORM_INTERMEDIARY_DISCLOSURE: "platform_intermediary_disclosure",
  /** Brokers / admins: collaboration, commission sharing, in-platform communications. */
  BROKER_COLLABORATION_CLAUSE: "broker_collaboration_clause",
} as const;

export type LegalDocumentType = (typeof LEGAL_DOCUMENT_TYPES)[keyof typeof LEGAL_DOCUMENT_TYPES];

/** Documents required for all users (signup/login). */
export const REQUIRED_FOR_PLATFORM: LegalDocumentType[] = [
  LEGAL_DOCUMENT_TYPES.TERMS,
  LEGAL_DOCUMENT_TYPES.PRIVACY,
];

/** Documents required for BNHUB host (before listing creation / host dashboard). */
export const REQUIRED_FOR_BNHUB_HOST: LegalDocumentType[] = [
  LEGAL_DOCUMENT_TYPES.BNHUB_HOST_AGREEMENT,
];

export const LEGAL_PATHS: Record<string, string> = {
  [LEGAL_DOCUMENT_TYPES.TERMS]: "/legal/terms",
  [LEGAL_DOCUMENT_TYPES.PRIVACY]: "/legal/privacy",
  copyright: "/legal/copyright",
  [LEGAL_DOCUMENT_TYPES.COOKIES]: "/legal/cookies",
  [LEGAL_DOCUMENT_TYPES.DISCLAIMER]: "/legal/disclaimer",
  [LEGAL_DOCUMENT_TYPES.BNHUB_HOST_AGREEMENT]: "/bnhub/host-agreement",
  [LEGAL_DOCUMENT_TYPES.BNHUB_LONG_TERM_RENTAL_AGREEMENT]: "/legal/bnhub-long-term-rental",
  [LEGAL_DOCUMENT_TYPES.BNHUB_BROKER_COLLABORATION_AGREEMENT]: "/legal/bnhub-broker-collaboration",
  [LEGAL_DOCUMENT_TYPES.BNHUB_GUEST_POLICY]: "/bnhub/guest-protection",
  [LEGAL_DOCUMENT_TYPES.BROKER_AGREEMENT]: "/legal/broker-agreement",
  [LEGAL_DOCUMENT_TYPES.PLATFORM_USAGE]: "/legal/platform-usage",
  [LEGAL_DOCUMENT_TYPES.PLATFORM_ACKNOWLEDGMENT]: "/legal/platform-acknowledgment",
};
