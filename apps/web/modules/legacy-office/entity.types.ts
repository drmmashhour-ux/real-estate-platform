/**
 * Multi-entity legacy / family-office structure — informational & operational tracking only.
 * Not legal or tax advice. Does not create binding governance.
 */

export const ENTITY_TYPE_VALUES = [
  "FAMILY_OFFICE",
  "HOLDING",
  "OPERATING",
  "INVESTMENT_VEHICLE",
  "TRUST_LIKE_INFO",
] as const;

export type EntityType = (typeof ENTITY_TYPE_VALUES)[number];

/** Base fields shared by all entity records in the graph. */
export type LegacyEntityBase = {
  id: string;
  name: string;
  entityType: EntityType;
  parentEntityId?: string | null;
  jurisdiction?: string | null;
  ownershipNotes?: string | null;
  governanceNotes?: string | null;
  /**
   * Optional: fraction (0–1) of this entity’s equity/voting (as modeled) held by the immediate parent.
   * Informational only; does not represent legal title.
   */
  informationalParentHeldFraction?: number | null;
};

export type FamilyOfficeEntity = LegacyEntityBase & { entityType: "FAMILY_OFFICE" };
export type HoldingEntity = LegacyEntityBase & { entityType: "HOLDING" };
export type OperatingEntity = LegacyEntityBase & { entityType: "OPERATING" };
export type InvestmentVehicle = LegacyEntityBase & { entityType: "INVESTMENT_VEHICLE" };

/**
 * Informational profile for trust-like or fiduciary arrangements — not a trust instrument.
 */
export type TrustLikeControlProfile = {
  id: string;
  /** Entity this profile describes (often HOLDING or FAMILY_OFFICE). */
  entityId: string;
  informationalOnly: true;
  summaryNotes?: string | null;
  trusteeOrFiduciaryNotes?: string | null;
  beneficiaryClassNotes?: string | null;
  amendmentOrTerminationNotes?: string | null;
};

export type LegacyOfficeEntity = FamilyOfficeEntity | HoldingEntity | OperatingEntity | InvestmentVehicle;

/** Full office state for graph + dashboard (all editable by the user in UI). */
export type LegacyOfficeState = {
  entities: LegacyOfficeEntity[];
  trustLikeProfiles: TrustLikeControlProfile[];
};
