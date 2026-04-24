import type {
  LecipmLegalBoundaryComplianceState,
  LecipmLegalBoundaryEntityType,
  LecipmLegalBoundaryModeSource,
  LecipmLegalBoundaryTransactionMode,
} from "@prisma/client";

export type TransactionEntityType = LecipmLegalBoundaryEntityType;
export type TransactionMode = LecipmLegalBoundaryTransactionMode;
export type ComplianceBoundaryState = LecipmLegalBoundaryComplianceState;
export type TransactionModeSource = LecipmLegalBoundaryModeSource;

/** Resolved + persisted legal boundary context for an entity (listing / deal / booking). */
export type TransactionContext = {
  id: string;
  entityType: TransactionEntityType;
  entityId: string;
  mode: TransactionMode;
  brokerId: string | null;
  complianceState: ComplianceBoundaryState;
  modeSource: TransactionModeSource;
  createdAt: Date;
  updatedAt: Date;
};

export const LECIPM_BROKER_REQUIRED_MESSAGE =
  "This action requires a licensed real estate broker." as const;

export const LEGAL_BOUNDARY_FSBO_DISCLOSURE_EN =
  "This transaction is not handled by a licensed real estate broker. You are acting independently." as const;

export const LEGAL_BOUNDARY_BROKERED_DISCLOSURE_EN =
  "This transaction is handled by a licensed real estate broker (OACIQ)." as const;
