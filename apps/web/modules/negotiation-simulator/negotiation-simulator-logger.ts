import { redactForLog } from "@/lib/security/redact";

type Ev =
  | "momentum_risk_computed"
  | "objection_path_forecasted"
  | "approach_simulated"
  | "best_approaches_selected"
  | "negotiation_simulator_run"
  | "logging_failure";

function emit(e: Ev, p?: Record<string, unknown>) {
  const tag = "[negotiation-sim]";
  const safe = p !== undefined ? redactForLog(p) : "";
  try {
    console.info(`${tag} ${e}`, safe ?? "");
  } catch {
    try {
      console.error("[negotiation-sim] logging_failure");
    } catch {
      /* no-op */
    }
  }
}

export const negSimLog = {
  momentumRisk: (p?: Record<string, unknown>) => emit("momentum_risk_computed", p),
  objectionPath: (p?: Record<string, unknown>) => emit("objection_path_forecasted", p),
  approachSim: (p?: Record<string, unknown>) => emit("approach_simulated", p),
  bestSelected: (p?: Record<string, unknown>) => emit("best_approaches_selected", p),
  run: (p?: Record<string, unknown>) => emit("negotiation_simulator_run", p),
  warn: (msg: string, p?: Record<string, unknown>) => emit("logging_failure", { msg, ...p }),
};
