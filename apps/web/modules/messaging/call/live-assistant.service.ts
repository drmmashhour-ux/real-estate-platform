import type { RealtimeSignalResult } from "@/modules/messaging/call/realtime-signal.service";
import { callAiLog } from "@/modules/messaging/call/call-ai-logger";

export type LiveCallHint = {
  message: string;
  priority: "low" | "medium" | "high";
};

export type LiveAssistantContext = {
  signals: RealtimeSignalResult;
  /** Elapsed since call start (seconds) */
  elapsedSec: number;
};

/**
 * Suggestion-style hints for the broker. No auto actions; for subtle UI.
 */
export function getLiveCallHints(ctx: LiveAssistantContext): { hints: LiveCallHint[] } {
  try {
    const { signals, elapsedSec } = ctx;
    const hints: LiveCallHint[] = [];

    if (signals.speakingBalance != null) {
      if (signals.speakingBalance < -0.15) {
        hints.push({
          message: "You are speaking a lot in this window — a short pause can invite the client to share more.",
          priority: "medium",
        });
      }
      if (signals.speakingBalance > 0.2) {
        hints.push({
          message: "The client is doing most of the talking — a concise summary can help keep the visit focused.",
          priority: "low",
        });
      }
    }

    if (signals.longSilences >= 2) {
      hints.push({
        message: "Noticing longer pauses — a light check-in or open question may help the conversation keep moving (your judgment).",
        priority: "high",
      });
    } else if (signals.longSilences === 1 && elapsedSec > 45) {
      hints.push({
        message: "A short silence appeared — re-engaging with one open question is often enough to restart flow.",
        priority: "medium",
      });
    }

    if (signals.engagementLevel === "low" && elapsedSec > 20) {
      hints.push({
        message: "Engagement looks lower on this timing read — a simple, open question can work better than a long monologue (suggestion only).",
        priority: "medium",
      });
    }

    if (signals.interruptions >= 2) {
      hints.push({
        message: "Several overlap-style signals — consider slowing the pace and confirming what you heard before adding more detail (hint only, not a judgment of anyone).",
        priority: "medium",
      });
    }

    if (hints.length === 0) {
      hints.push({
        message: "Keep a steady rhythm: brief confirmation, one question, then space to answer — routine coaching hint only.",
        priority: "low",
      });
    }

    callAiLog.liveHintGenerated({ n: hints.length });
    return { hints: hints.slice(0, 5) };
  } catch (e) {
    callAiLog.warn("getLiveCallHints", { err: e instanceof Error ? e.message : String(e) });
    return { hints: [{ message: "Hints are temporarily limited — use your own judgment in the call.", priority: "low" }] };
  }
}
