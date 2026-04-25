export * from "./types/user-intelligence.types";
export { recordSignal, listSignals } from "./services/user-preference-signal.service";
export { ensureUserPreferenceProfile, rebuildProfile, getProfile, createSnapshot } from "./services/user-preference-profile.service";
export { getJourneyState, updateJourneyState } from "./services/user-journey.service";
export type { UserJourneyView } from "./services/user-journey.service";
/** Wave 13 context for Dream Home / listings / playbooks; optional 2nd arg merges session explicit prefs over DB. */
export {
  buildPersonalizationContext,
  mergePlaybookContextWithUserIntelligence,
  personalisationListingNudge,
  resolvePreferredCityHint,
  reorderListingsForWave13Personalization,
} from "./services/user-personalization.service";
export { mergeStoredPreferencesIntoIntake, recordDreamHomeQuestionnaire } from "./integrations/dream-home-user-intelligence";
export {
  recordListingInquiryTouch,
  recordListingSaveEngagement,
  recordPipelineDealProgression,
  recordBrokerCrmLeadStatusSignal,
  recordBrokerCrmNoteSignal,
  recordBrokerCrmOutboundMessageSignal,
  recordMarketplaceDealCrmStageSignal,
  recordMarketplaceLeadPipelineSignal,
  recordMarketplaceLeadNoteSignal,
} from "./integrations/crm-user-intelligence";
