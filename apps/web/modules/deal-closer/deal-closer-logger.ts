import { redactForLog } from "@/lib/security/redact";

type CloserEvent =
  | "closing_readiness_computed"
  | "close_blockers_detected"
  | "next_close_actions_recommended"
  | "premature_push_risk_computed"
  | "deal_closer_run"
  | "logging_failure";

function emit(event: CloserEvent, payload?: Record<string, unknown>) {
  const tag = "[deal-closer]";
  const safe = payload !== undefined ? redactForLog(payload) : "";
  try {
    console.info(`${tag} ${event}`, safe ?? "");
  } catch {
    try {
      console.error("[deal-closer] logging_failure");
    } catch {
      /* never throw */
    }
  }
}

export const dealCloserLog = {
  closingReadinessComputed: (p?: Record<string, unknown>) => emit("closing_readiness_computed", p),
  closeBlockersDetected: (p?: Record<string, unknown>) => emit("close_blockers_detected", p),
  nextCloseActionsRecommended: (p?: Record<string, unknown>) => emit("next_close_actions_recommended", p),
  prematurePushRiskComputed: (p?: Record<string, unknown>) => emit("premature_push_risk_computed", p),
  dealCloserRun: (p?: Record<string, unknown>) => emit("deal_closer_run", p),
  warn: (msg: string, p?: Record<string, unknown>) => emit("logging_failure", { msg, ...p }),
};
