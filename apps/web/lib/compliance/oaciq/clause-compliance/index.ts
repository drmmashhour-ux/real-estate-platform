export type {
  ClauseCategory,
  ClauseComponentKey,
  ClauseComplianceFlag,
  ClauseLibraryEntry,
  ClauseInstance,
  ClauseIssueSeverity,
  ClauseValidationIssue,
  ClauseValidationResult,
  ClauseEnforcementKind,
  ClauseEnforcementDescriptor,
  ClauseAuditEvent,
} from "@/lib/compliance/oaciq/clause-compliance/types";
export { OACIQ_CLAUSE_LIBRARY, getClauseLibraryEntry, listActiveClausesByCategory } from "@/lib/compliance/oaciq/clause-compliance/library";
export { scanClauseTextForAmbiguity, detectAmbiguousTiming, detectVagueBusinessDays } from "@/lib/compliance/oaciq/clause-compliance/ambiguity";
export { enforcementDescriptorsForFlags } from "@/lib/compliance/oaciq/clause-compliance/enforcement";
export {
  validateClauseInstance,
  validateClauseBatch,
  validateClauseBatchSync,
  validateLegacyClauseStrings,
} from "@/lib/compliance/oaciq/clause-compliance/validate-engine";
export { deterministicClauseSuggestions, suggestClauseWordingWithAi } from "@/lib/compliance/oaciq/clause-compliance/ai-assist";
export { logClauseComplianceAudit } from "@/lib/compliance/oaciq/clause-compliance/audit";
export type { ClauseDbValidation } from "@/lib/compliance/oaciq/clause-compliance/clause-db.service";
export {
  addClauseToContract,
  getClausesLibraryGrouped,
  persistClauseValidationRun,
  updateContractClauseValidationState,
  validateAllContractClauses,
  validateClauseAgainstLibrary,
} from "@/lib/compliance/oaciq/clause-compliance/clause-db.service";
