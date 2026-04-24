export { computeDiff } from "./diffEngine";
export type { ClauseDiffResult, RewrittenClause } from "./diffEngine";
export { storeMemoryExample } from "./memory-store.service";
export { buildMemoryPromptBlockForFormKey, mergeComplianceThenMemoryThenModel } from "./prompt-augmentation";
export { anonymizeJsonValue } from "./anonymize-json";
export {
  ingestDiffIntoPatterns,
  makePatternKey,
  inferFindingKey,
  recordManualPattern,
  PATTERN_THRESHOLD,
} from "./pattern-extraction";
export {
  getDraftPersonalizationForUser,
  personalizationToPromptFragment,
  upsertUserPreference,
} from "./user-preferences";
export { logAiMemory } from "./ai-memory-logger";
