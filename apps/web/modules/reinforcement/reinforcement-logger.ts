import { redactForLog } from "@/lib/security/redact";

type Ev =
  | "policy_loaded"
  | "context_bucket_built"
  | "strategy_selected"
  | "exploration_triggered"
  | "reward_computed"
  | "arm_stat_updated"
  | "feedback_recorded"
  | "logging_failure";

function emit(e: Ev, p?: Record<string, unknown>) {
  const tag = "[reinforcement]";
  const safe = p !== undefined ? redactForLog(p) : "";
  try {
    console.info(`${tag} ${e}`, safe ?? "");
  } catch {
    try {
      console.error("[reinforcement] logging_failure");
    } catch {
      /* no-op */
    }
  }
}

export const reinforcementLog = {
  policyLoaded: (p?: Record<string, unknown>) => emit("policy_loaded", p),
  contextBucket: (p?: Record<string, unknown>) => emit("context_bucket_built", p),
  selected: (p?: Record<string, unknown>) => emit("strategy_selected", p),
  explore: (p?: Record<string, unknown>) => emit("exploration_triggered", p),
  reward: (p?: Record<string, unknown>) => emit("reward_computed", p),
  arm: (p?: Record<string, unknown>) => emit("arm_stat_updated", p),
  feedback: (p?: Record<string, unknown>) => emit("feedback_recorded", p),
  warn: (msg: string, p?: Record<string, unknown>) => emit("logging_failure", { msg, ...p }),
};
