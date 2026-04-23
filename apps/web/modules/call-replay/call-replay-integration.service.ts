import { detectClientPsychology } from "@/modules/sales-psychology/psychology-detection.service";
import type { PsychologyDetectionResult } from "@/modules/sales-psychology/psychology.types";
import { buildCallAssistantNotes, type LearningBlob } from "@/modules/call-assistant/call-assistant-learning.service";
import type { CallStage } from "@/modules/call-assistant/call-assistant.types";
import type { SalesCallOutcome } from "@/modules/sales-scripts/sales-script.types";

import type { TranscriptSegment, CallReplayAnalysisResult } from "./call-replay.types";

/**
 * Optional bridge: same call can be cross-referenced in training and live assist tools.
 * No side effects — call from client or server when you want to log a review.
 */
export function prospectTextForIntegrations(segments: TranscriptSegment[]): string {
  return segments
    .filter((s) => s.speaker === "prospect")
    .map((s) => s.text)
    .join(" ");
}

export function psychologyFromReplayTranscript(segments: TranscriptSegment[]): PsychologyDetectionResult {
  const all = prospectTextForIntegrations(segments);
  const last = segments.filter((s) => s.speaker === "prospect").pop()?.text ?? "";
  return detectClientPsychology(last, all);
}

export function callAssistantNotesFromReplay(
  userNotes: string,
  analysis: CallReplayAnalysisResult,
  opts: { outcome?: SalesCallOutcome; secondsApprox?: number } = {},
): string {
  const stagesVisited: CallStage[] = ["opening", "discovery", "closing"];
  const blob: LearningBlob = {
    outcome: opts.outcome ?? "DEMO",
    stagesVisited,
    secondsInCallApprox: opts.secondsApprox ?? 0,
    objectionLabels: analysis.events.filter((e) => e.kind === "objection").map((e) => e.message),
  };
  return buildCallAssistantNotes(userNotes, blob);
}

export function trainingModuleLinkForReplay(reviewed: boolean, trainingPath: string): string {
  if (!reviewed) return trainingPath;
  return `${trainingPath}${trainingPath.includes("?") ? "&" : "?"}from=call-replay`;
}
