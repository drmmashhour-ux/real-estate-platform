/**
 * Bridge negotiation / messaging surfaces to DISC-style closing cues from recent prospect text.
 * Deterministic — same inputs as live call assistant; does not replace legal negotiation analysis.
 */
export type { ClientPersonalityType } from "@/modules/personality-closing/personality.types";
export { detectClientPersonality } from "@/modules/personality-closing/personality-detection.service";
export { buildClosingCoachBundle } from "@/modules/personality-closing/personality-response.service";
