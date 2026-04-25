import { redactForLog } from "@/lib/security/redact";

type Ev =
  | "strategy_execution_tracked"
  | "outcome_tracked"
  | "attribution_computed"
  | "performance_updated"
  | "logging_failure";

function emit(e: Ev, p?: Record<string, unknown>) {
  const tag = "[strategy-benchmark]";
  const safe = p !== undefined ? redactForLog(p) : "";
  try {
    console.info(`${tag} ${e}`, safe ?? "");
  } catch {
    try {
      console.error("[strategy-benchmark] logging_failure");
    } catch {
      /* no-op */
    }
  }
}

export const strategyBenchmarkLog = {
  execution: (p?: Record<string, unknown>) => emit("strategy_execution_tracked", p),
  outcome: (p?: Record<string, unknown>) => emit("outcome_tracked", p),
  attribution: (p?: Record<string, unknown>) => emit("attribution_computed", p),
  performance: (p?: Record<string, unknown>) => emit("performance_updated", p),
  warn: (msg: string, p?: Record<string, unknown>) => emit("logging_failure", { msg, ...p }),
};
