import { redactForLog } from "@/lib/security/redact";

type Ev =
  | "roi_analysis_run"
  | "capital_allocation_generated"
  | "expansion_analysis_run"
  | "scenario_simulated"
  | "investor_snapshot_built"
  | "investor_alerts_generated"
  | "log_warn";

function emit(e: Ev, p?: Record<string, unknown>) {
  const tag = "[investor-intel]";
  const safe = p !== undefined ? redactForLog(p) : "";
  try {
    console.info(`${tag} ${e}`, safe ?? "");
  } catch {
    try {
      console.error("[investor-intel] log_failure");
    } catch {
      /* no-op */
    }
  }
}

export const investIntelLog = {
  roi: (p?: Record<string, unknown>) => emit("roi_analysis_run", p),
  alloc: (p?: Record<string, unknown>) => emit("capital_allocation_generated", p),
  expand: (p?: Record<string, unknown>) => emit("expansion_analysis_run", p),
  scenario: (p?: Record<string, unknown>) => emit("scenario_simulated", p),
  snapshot: (p?: Record<string, unknown>) => emit("investor_snapshot_built", p),
  alerts: (p?: Record<string, unknown>) => emit("investor_alerts_generated", p),
  warn: (m: string, p?: Record<string, unknown>) => emit("log_warn", { m, ...p }),
};
