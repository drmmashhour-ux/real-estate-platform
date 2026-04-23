import type { CoachSessionFeedback } from "./team.types";
import { notifyTeam } from "./team-notifications.service";
import { loadStore, saveStore, uid } from "./team-storage";

export function addCoachFeedback(input: {
  sessionId: string;
  coachId: string;
  teamId: string;
  comment: string;
  highlights?: string[];
  mistakes?: string[];
}): CoachSessionFeedback {
  const store = loadStore();
  const feedbackId = uid();
  const row: CoachSessionFeedback = {
    feedbackId,
    sessionId: input.sessionId,
    coachId: input.coachId,
    comment: input.comment.trim(),
    highlights: (input.highlights ?? []).map((x) => x.trim()).filter(Boolean),
    mistakes: (input.mistakes ?? []).map((x) => x.trim()).filter(Boolean),
    createdAtIso: new Date().toISOString(),
  };
  store.feedback[feedbackId] = row;
  saveStore(store);

  notifyTeam(input.teamId, {
    kind: "coach_feedback",
    title: "New coach feedback",
    body: input.comment.slice(0, 140) + (input.comment.length > 140 ? "…" : ""),
  });

  return row;
}

export function listFeedbackForSession(sessionId: string): CoachSessionFeedback[] {
  return Object.values(loadStore().feedback).filter((f) => f.sessionId === sessionId);
}

export function listFeedbackForTeam(teamId: string): CoachSessionFeedback[] {
  const store = loadStore();
  const sessionIds = new Set(Object.values(store.sessions).filter((s) => s.teamId === teamId).map((s) => s.sessionId));
  return Object.values(store.feedback).filter((f) => sessionIds.has(f.sessionId));
}
