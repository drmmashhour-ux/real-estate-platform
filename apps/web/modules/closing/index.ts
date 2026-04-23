export type {
  ClosingFlowContext,
  ClosingFlowStep,
  ClosingStepMeta,
  HardObjectionKey,
  UltimateCloserResult,
} from "./closing.types";

export {
  CLOSING_STEP_ORDER,
  defaultStepFromCallStage,
  metaForStep,
  stepIndex,
} from "./closing-steps.engine";

export {
  advanceStepHint,
  computeControlLevel,
  getNextStep,
  shouldAutoClose,
} from "./closing-flow.service";

export {
  buildUltimateCloserPayload,
  closerStepRail,
} from "./closing-response.service";

export { getHardObjectionResponse, HARD_OBJECTION_RESPONSES } from "./objection-close.service";

export {
  closerDemoRate,
  loadCloserAnalytics,
  recordCloserSessionEnd,
  recordCloserStepView,
  recordCloseNowSignal,
} from "./closing-analytics.service";
