/**
 * Back-compat re-exports — prefer `platform-improvement-state.service.ts` for new code.
 */

export {
  buildExecutionPanelModel,
  computeExecutionFollowThrough as computeFollowThroughForBundle,
  getPriorityState,
  getStoredPriorityStatus,
  listPriorityStates,
  listRecentHistory,
  resetPlatformImprovementStateForTests,
  setPriorityStatus,
  statusesByPriorityIdFromDoc,
  syncExecutionStateWithBundle,
  syncExecutionStateWithBundle as syncOperatorStateWithBundle,
  transitionOperatorPriorityStatus,
  updatePriorityTimestamp,
} from "./platform-improvement-state.service";
