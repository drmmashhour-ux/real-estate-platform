import type { CallEvent, CallEventType } from "@/modules/messaging/call/call.types";
import { callAiLog } from "@/modules/messaging/call/call-ai-logger";

export type CallStateForSignals = {
  startedAt: string;
  now?: string;
  events: CallEvent[];
};

export type RealtimeSignalResult = {
  speakingBalance?: number;
  longSilences: number;
  interruptions: number;
  engagementLevel: "low" | "medium" | "high";
};

/**
 * Timing- and event-based signals only. No transcript required. Heuristic, not a judgment of people.
 */
export function analyzeRealtimeSignals(callState: CallStateForSignals): RealtimeSignalResult {
  try {
    const events = callState.events ?? [];
    const longSilences = events.filter(
      (e) => (e.type as CallEventType) === "long_pause" || (e.type as CallEventType) === "silence"
    ).length;
    const interruptions = events.filter((e) => e.type === "interruption").length;

    let b = 0;
    let nBroker = 0;
    let nClient = 0;
    for (const e of events) {
      if (e.type !== "speech_segment") continue;
      if (e.speaker === "broker") nBroker += 1;
      else if (e.speaker === "client") nClient += 1;
    }
    const nSeg = nBroker + nClient;
    if (nSeg > 0) {
      b = (nClient - nBroker) / nSeg;
    } else {
      b = 0;
    }
    // Engagement: more segments + fewer long silences and interruptions => higher
    const speechN = events.filter((e) => e.type === "speech_segment").length;
    const engagementScore = speechN * 3 - longSilences * 2 - interruptions;
    const engagementLevel: RealtimeSignalResult["engagementLevel"] =
      engagementScore >= 6 ? "high" : engagementScore >= 0 ? "medium" : "low";

    const out: RealtimeSignalResult = {
      longSilences,
      interruptions,
      engagementLevel,
    };
    if (nSeg > 0) {
      out.speakingBalance = Math.round(b * 100) / 100;
    }
    return out;
  } catch (e) {
    callAiLog.warn("analyzeRealtimeSignals", { err: e instanceof Error ? e.message : String(e) });
    return { longSilences: 0, interruptions: 0, engagementLevel: "medium" };
  }
}
