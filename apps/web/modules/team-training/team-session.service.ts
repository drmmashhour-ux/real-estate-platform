import type { TeamSession, TeamSessionResult, TeamTrainingMode } from "./team.types";
import { syncAiSalesProfilesFromTrainingSession } from "@/modules/ai-sales-manager/ai-sales-integration.service";

import { awardXpForSession, touchStreak } from "./team-gamification.service";
import { bumpChallengeProgress } from "./team-challenges.service";
import { notifyTeam } from "./team-notifications.service";
import { recordMemberScores } from "./team-leaderboard.service";
import { loadStore, saveStore, uid } from "./team-storage";

export function createTrainingSession(input: {
  teamId: string;
  scenarioId?: string;
  mode: TeamTrainingMode;
  participantMemberIds: string[];
  notes?: string;
}): TeamSession {
  const store = loadStore();
  if (!store.teams[input.teamId]) throw new Error("unknown_team");
  const sessionId = uid();
  const session: TeamSession = {
    sessionId,
    teamId: input.teamId,
    scenarioId: input.scenarioId,
    mode: input.mode,
    participantMemberIds: [...new Set(input.participantMemberIds)],
    startedAtIso: new Date().toISOString(),
    results: [],
    notes: input.notes?.trim(),
  };
  store.sessions[sessionId] = session;
  saveStore(store);
  return session;
}

/** Append outcomes after reps finish a scenario run (live or logged). */
export function completeSessionResults(
  sessionId: string,
  results: TeamSessionResult[],
): TeamSession | null {
  const store = loadStore();
  const session = store.sessions[sessionId];
  if (!session) return null;
  session.results = results;
  session.endedAtIso = new Date().toISOString();
  saveStore(store);

  for (const r of results) {
    recordMemberScores(r.memberId, r.avgScore, r.closingRate, r.controlScore, r.improvementDelta);
    touchStreak(r.memberId);
    awardXpForSession(r.memberId, r.avgScore, r.won);
    if (r.scenarioId || r.won) bumpChallengeProgress(r.memberId, r.scenarioId, r.won);
  }

  const team = store.teams[session.teamId];
  if (team) {
    notifyTeam(session.teamId, {
      kind: "general",
      title: "Training session logged",
      body: `${results.length} participant(s) — mode ${session.mode}.`,
    });
  }

  try {
    syncAiSalesProfilesFromTrainingSession(session);
  } catch {
    /* optional intelligence layer */
  }

  return session;
}

export function getSession(sessionId: string): TeamSession | undefined {
  return loadStore().sessions[sessionId];
}

export function listSessionsForTeam(teamId: string): TeamSession[] {
  return Object.values(loadStore().sessions)
    .filter((s) => s.teamId === teamId)
    .sort((a, b) => (b.startedAtIso ?? "").localeCompare(a.startedAtIso ?? ""));
}
