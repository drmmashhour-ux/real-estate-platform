import { redactForLog } from "@/lib/security/redact";

function emit(
  level: "info" | "warn" | "error",
  event:
    | "next_action_generated"
    | "message_suggested"
    | "suggestion_used"
    | "action_executed"
    | "assignment_recorded"
    | "objections_classified"
    | "deal_stage_classified"
    | "risk_heatmap_built"
    | "broker_coaching_generated"
    | "closing_readiness_computed"
    | "logging_failure",
  payload?: Record<string, unknown>
) {
  const tag = "[messaging-ai]";
  const safe = payload !== undefined ? redactForLog(payload) : "";
  const line = `${tag} ${event}`;
  try {
    if (level === "info") console.info(line, safe ?? "");
    else if (level === "warn") console.warn(line, safe ?? "");
    else console.error(line, safe ?? "");
  } catch {
    try {
      console.error("[messaging-ai] logging_failure");
    } catch {
      /* no-op: never throw */
    }
  }
}

export const messagingAiLog = {
  nextActionGenerated: (payload?: Record<string, unknown>) => emit("info", "next_action_generated", payload),
  messageSuggested: (payload?: Record<string, unknown>) => emit("info", "message_suggested", payload),
  suggestionUsed: (payload?: Record<string, unknown>) => emit("info", "suggestion_used", payload),
  actionNoted: (payload?: Record<string, unknown>) => emit("info", "action_executed", payload),
  assignmentRecorded: (payload?: Record<string, unknown>) => emit("info", "assignment_recorded", payload),
  objectionsClassified: (payload?: Record<string, unknown>) => emit("info", "objections_classified", payload),
  dealStageClassified: (payload?: Record<string, unknown>) => emit("info", "deal_stage_classified", payload),
  riskHeatmapBuilt: (payload?: Record<string, unknown>) => emit("info", "risk_heatmap_built", payload),
  brokerCoachingGenerated: (payload?: Record<string, unknown>) => emit("info", "broker_coaching_generated", payload),
  closingReadinessComputed: (payload?: Record<string, unknown>) => emit("info", "closing_readiness_computed", payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("warn", "logging_failure", { msg, ...payload }),
};
