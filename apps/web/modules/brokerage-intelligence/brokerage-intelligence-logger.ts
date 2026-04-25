import { redactForLog } from "@/lib/security/redact";

type Ev =
  | "routing_decision_made"
  | "deal_priority_computed"
  | "broker_load_computed"
  | "segment_analysis_run"
  | "portfolio_analysis_run"
  | "context_bucket_built"
  | "log_warn";

function emit(e: Ev, p?: Record<string, unknown>) {
  const tag = "[portfolio]";
  const safe = p !== undefined ? redactForLog(p) : "";
  try {
    console.info(`${tag} ${e}`, safe ?? "");
  } catch {
    try {
      console.error("[portfolio] logging_failure");
    } catch {
      /* no-op */
    }
  }
}

export const portfolioIntelLog = {
  routing: (p?: Record<string, unknown>) => emit("routing_decision_made", p),
  dealPriority: (p?: Record<string, unknown>) => emit("deal_priority_computed", p),
  brokerLoad: (p?: Record<string, unknown>) => emit("broker_load_computed", p),
  segment: (p?: Record<string, unknown>) => emit("segment_analysis_run", p),
  analysis: (p?: Record<string, unknown>) => emit("portfolio_analysis_run", p),
  contextBucket: (p?: Record<string, unknown>) => emit("context_bucket_built", p),
  warn: (msg: string, p?: Record<string, unknown>) => emit("log_warn", { msg, ...p }),
};
