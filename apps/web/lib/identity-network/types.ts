/**
 * Global Real Estate Identity Network – types and constants.
 */

export const AUTHORITY_TYPES = [
  "owner_self_listed",
  "verified_broker_authorized",
  "delegated_manager_authorized",
  "other_platform_approved",
] as const;
export type AuthorityType = (typeof AUTHORITY_TYPES)[number];

export const IDENTITY_TYPES = ["OWNER", "BROKER", "ORGANIZATION"] as const;
export type IdentityType = (typeof IDENTITY_TYPES)[number];

export const RESOLUTION_OUTCOMES = ["exact_match", "probable_match", "manual_review_required", "mismatch"] as const;
export type ResolutionOutcome = (typeof RESOLUTION_OUTCOMES)[number];

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const LINK_STATUSES = ["ACTIVE", "REVOKED"] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

export interface OwnerIdentityInput {
  legalName: string;
  primarySource?: string | null;
  verificationStatus?: string;
}

export interface BrokerIdentityInput {
  legalName: string;
  licenseNumber: string;
  brokerageName: string;
  regulatorRef?: string | null;
  verificationStatus?: string;
}

export interface OrganizationIdentityInput {
  legalName: string;
  organizationType: string;
  verificationStatus?: string;
}

export interface ListingAuthorityInput {
  propertyIdentityId: string;
  authorityType: AuthorityType;
  ownerIdentityId?: string | null;
  brokerIdentityId?: string | null;
  organizationIdentityId?: string | null;
  documentReference?: string | null;
  startDate: Date;
  endDate?: Date | null;
  status?: string;
  verificationStatus?: string;
}

export interface OwnershipHistoryInput {
  propertyIdentityId: string;
  ownerIdentityId: string;
  source: string;
  effectiveStartDate: Date;
  effectiveEndDate?: Date | null;
  verificationStatus: string;
  notes?: string | null;
}

export interface BrokerAuthorizationInput {
  propertyIdentityId: string;
  brokerIdentityId: string;
  ownerIdentityId?: string | null;
  authorizationSource: string;
  startDate: Date;
  endDate?: Date | null;
  verificationStatus: string;
}

export interface IdentityRiskInput {
  identityType: IdentityType;
  identityId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  riskReasons?: Record<string, unknown> | string[] | null;
  investigationStatus?: string | null;
}

export interface ResolutionCandidate {
  identityId: string;
  outcome: ResolutionOutcome;
  confidence?: number;
  reasons?: string[];
}

export interface IdentityNetworkPropertyView {
  propertyIdentityId: string;
  ownershipHistory: Array<{
    ownerIdentityId: string;
    legalName: string;
    normalizedName: string;
    source: string;
    effectiveStartDate: string;
    effectiveEndDate: string | null;
    verificationStatus: string;
  }>;
  brokerAuthorizationHistory: Array<{
    brokerIdentityId: string;
    legalName: string;
    licenseNumber: string;
    authorizationSource: string;
    startDate: string;
    endDate: string | null;
    verificationStatus: string;
  }>;
  listingAuthorities: Array<{
    id: string;
    authorityType: string;
    ownerIdentityId: string | null;
    brokerIdentityId: string | null;
    status: string;
    verificationStatus: string;
    startDate: string;
    endDate: string | null;
  }>;
}
