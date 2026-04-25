import { redactForLog } from "@/lib/security/redact";

type CallEventName =
  | "call_started"
  | "call_ended"
  | "realtime_signal_detected"
  | "live_hint_generated"
  | "post_call_analysis_completed"
  | "transcript_attached"
  | "logging_failure";

function emit(level: "info" | "warn" | "error", event: CallEventName, payload?: Record<string, unknown>) {
  const tag = "[call-ai]";
  const safe = payload !== undefined ? redactForLog(payload) : "";
  const line = `${tag} ${event}`;
  try {
    if (level === "info") console.info(line, safe ?? "");
    else if (level === "warn") console.warn(line, safe ?? "");
    else console.error(line, safe ?? "");
  } catch {
    try {
      console.error("[call-ai] logging_failure");
    } catch {
      /* never throw */
    }
  }
}

export const callAiLog = {
  callStarted: (p?: Record<string, unknown>) => emit("info", "call_started", p),
  callEnded: (p?: Record<string, unknown>) => emit("info", "call_ended", p),
  realtimeSignalDetected: (p?: Record<string, unknown>) => emit("info", "realtime_signal_detected", p),
  liveHintGenerated: (p?: Record<string, unknown>) => emit("info", "live_hint_generated", p),
  postCallAnalysisCompleted: (p?: Record<string, unknown>) => emit("info", "post_call_analysis_completed", p),
  transcriptAttached: (p?: Record<string, unknown>) => emit("info", "transcript_attached", p),
  warn: (msg: string, p?: Record<string, unknown>) => emit("warn", "logging_failure", { msg, ...p }),
};
