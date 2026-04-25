import { redactForLog } from "@/lib/security/redact";

type Ev =
  | "offer_readiness_computed"
  | "negotiation_posture_recommended"
  | "offer_blockers_detected"
  | "competitive_risk_computed"
  | "offer_actions_recommended"
  | "offer_strategy_run"
  | "logging_failure";

function emit(e: Ev, p?: Record<string, unknown>) {
  const tag = "[offer-strategy]";
  const safe = p !== undefined ? redactForLog(p) : "";
  try {
    console.info(`${tag} ${e}`, safe ?? "");
  } catch {
    try {
      console.error("[offer-strategy] logging_failure");
    } catch {
      /* no-op */
    }
  }
}

export const offerStrategyLog = {
  offerReadinessComputed: (p?: Record<string, unknown>) => emit("offer_readiness_computed", p),
  negotiationPostureRecommended: (p?: Record<string, unknown>) => emit("negotiation_posture_recommended", p),
  offerBlockersDetected: (p?: Record<string, unknown>) => emit("offer_blockers_detected", p),
  competitiveRiskComputed: (p?: Record<string, unknown>) => emit("competitive_risk_computed", p),
  offerActionsRecommended: (p?: Record<string, unknown>) => emit("offer_actions_recommended", p),
  offerStrategyRun: (p?: Record<string, unknown>) => emit("offer_strategy_run", p),
  warn: (msg: string, p?: Record<string, unknown>) => emit("logging_failure", { msg, ...p }),
};
