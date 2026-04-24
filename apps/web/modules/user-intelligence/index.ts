export * from "./types/user-intelligence.types";
export { recordSignal, listSignals } from "./services/user-preference-signal.service";
export { ensureUserPreferenceProfile, rebuildProfile, getProfile, createSnapshot } from "./services/user-preference-profile.service";
export { getJourneyState, updateJourneyState } from "./services/user-journey.service";
export type { UserJourneyView } from "./services/user-journey.service";
export { buildPersonalizationContext, mergePlaybookContextWithUserIntelligence, personalisationListingNudge } from "./services/user-personalization.service";
export { mergeStoredPreferencesIntoIntake, recordDreamHomeQuestionnaire } from "./integrations/dream-home-user-intelligence";
