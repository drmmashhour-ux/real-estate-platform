/**
 * FSBO co-ownership compliance autopilot — deterministic, read-only recommendations / gates.
 */

export type CoownershipAutopilotMode =
  | "OFF"
  | "ASSIST"
  | "SAFE_AUTOPILOT"
  | "FULL_AUTOPILOT_APPROVAL";

export type CoownershipAutopilotTrigger =
  | "listing_created"
  | "listing_updated"
  | "scheduled_scan";

export type CoownershipActionType = "NONE" | "RECOMMEND_ONLY" | "ENSURE_CHECKLIST" | "BLOCK_ACTION";

export type SellerDeclarationCoownershipSlice = {
  isCondo?: boolean;
  condoRulesReviewed?: boolean;
  condoSyndicateDocumentsAvailable?: boolean;
  condoFinancialStatementsAvailable?: boolean;
  condoContingencyFundDetails?: string;
};

export type CoownershipListingInput = {
  id: string;
  propertyType: string | null | undefined;
  /** When true, treat as co-ownership path even if property type is not CONDO. */
  isCoOwnership?: boolean;
  sellerDeclarationJson?: SellerDeclarationCoownershipSlice | null;
};

export type CoownershipChecklistItem = {
  key: string;
  label: string;
  done: boolean;
};

export type CoownershipAutopilotResult = {
  listingId: string;
  trigger: CoownershipAutopilotTrigger;
  mode: CoownershipAutopilotMode;
  cycleKey: string;
  /** Whether co-ownership compliance rules apply to this listing. */
  complianceApplies: boolean;
  decisionEmitted: boolean;
  complianceDecisionId: string | null;
  action: CoownershipActionType;
  checklistEnsured: boolean;
  checklistItemKeys: string[];
  recommendation: string | null;
  blockReason: string | null;
  certificateComplete: boolean;
};

export type CoownershipValidationSummary = {
  triggerDetection: "PASS" | "FAIL";
  checklistCreation: "PASS" | "FAIL";
  duplicatePrevention: "PASS" | "FAIL";
  recommendationVisibility: "PASS" | "FAIL";
  blockingLogic: "PASS" | "FAIL";
  scheduledScanBehavior: "PASS" | "FAIL";
};
