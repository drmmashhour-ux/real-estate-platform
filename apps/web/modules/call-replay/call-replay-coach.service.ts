import type { CoachCommentReplay } from "./call-replay.types";
import { getRecording, updateRecording, uid } from "./call-storage.service";

export function addCoachCommentReplay(input: {
  recordingId: string;
  body: string;
  coachId?: string;
  segmentId?: string;
}): CoachCommentReplay | null {
  const r = getRecording(input.recordingId);
  if (!r) return null;
  const row: CoachCommentReplay = {
    commentId: uid(),
    recordingId: input.recordingId,
    coachId: input.coachId,
    body: input.body.trim(),
    createdAtIso: new Date().toISOString(),
    segmentId: input.segmentId,
  };
  const prev = r.coachComments ?? [];
  updateRecording(input.recordingId, { coachComments: [...prev, row] });
  return row;
}
