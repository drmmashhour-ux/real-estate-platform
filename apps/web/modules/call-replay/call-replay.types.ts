/** Call replay — user-supplied recordings only; no automatic capture. */

export type SpeakerRole = "rep" | "prospect" | "unknown";

/** Timed transcript line — user can paste or edit. */
export type TranscriptSegment = {
  id: string;
  speaker: SpeakerRole;
  text: string;
  startSec: number;
  endSec: number;
};

export type MomentTag = "mistake" | "improvement" | "strong";

export type CoachCommentReplay = {
  commentId: string;
  recordingId: string;
  coachId?: string;
  body: string;
  createdAtIso: string;
  segmentId?: string;
};

export type CallRecordingMetadata = {
  /** Optional context typed by user */
  notes?: string;
  /** User confirms they control the recording and comply with policy */
  consentAcknowledged: boolean;
  /** Source description e.g. "Uploaded WAV from CRM export" */
  sourceLabel?: string;
};

export type CallRecording = {
  recordingId: string;
  title: string;
  createdAtIso: string;
  durationSec?: number;
  transcript: TranscriptSegment[];
  metadata: CallRecordingMetadata;
  /** Coach / reviewer tags */
  segmentTags?: Record<string, MomentTag>;
  coachComments?: CoachCommentReplay[];
  /** True when audio blob was persisted (may need re-upload if cleared) */
  audioStored?: boolean;
};

export type ReplayEventKind =
  | "objection"
  | "hesitation"
  | "weak_close"
  | "strong_response"
  | "long_explanation"
  | "control_loss";

export type ReplayEvent = {
  kind: ReplayEventKind;
  segmentId?: string;
  startSec: number;
  message: string;
};

export type CallReplayAnalysisResult = {
  overallScore: number;
  strengths: string[];
  mistakes: string[];
  missedOpportunities: string[];
  /** One coaching line per flagged segment where helpful */
  betterResponses: { segmentId: string; suggestion: string }[];
  events: ReplayEvent[];
};
