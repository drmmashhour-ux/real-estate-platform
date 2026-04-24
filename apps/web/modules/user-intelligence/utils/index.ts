/**
 * User preference utilities — normalize (strip unsafe keys), merge (session + stored), scoring (journey weights).
 */
export { normalizePreferenceRecord, safeSignalValue } from "./user-preference-normalize";
export { mergeSignalsToProfile, applySessionOverStored } from "./user-preference-merge";
export * from "./scoring";
