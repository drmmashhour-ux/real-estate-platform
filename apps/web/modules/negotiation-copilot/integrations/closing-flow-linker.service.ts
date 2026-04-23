/**
 * Optional negotiation / deal-room wiring for the Ultimate Closer flow (deterministic coaching only).
 */
export type { ClosingFlowContext, ClosingFlowStep, UltimateCloserResult } from "@/modules/closing";
export {
  buildUltimateCloserPayload,
  getHardObjectionResponse,
  getNextStep,
  shouldAutoClose,
} from "@/modules/closing";

