import { describe, expect, it, beforeEach } from "vitest";

import { emptyStore, saveStore } from "@/modules/team-training/team-storage";
import { addTeamMember, createTeam, listTeamMembers } from "@/modules/team-training/team.service";
import {
  completeSessionResults,
  createTrainingSession,
} from "@/modules/team-training/team-session.service";
import { buildLeaderboard } from "@/modules/team-training/team-leaderboard.service";

describe("team-training", () => {
  beforeEach(() => {
    saveStore(emptyStore());
  });

  it("creates team and member", () => {
    const t = createTeam({ name: "Pipeline A", coachId: "c1", coachDisplayName: "Coach" });
    expect(t.teamId.length).toBeGreaterThan(4);
    const m = addTeamMember(t.teamId, { displayName: "Alex" });
    expect(m?.displayName).toBe("Alex");
    expect(listTeamMembers(t.teamId).length).toBe(2);
  });

  it("tracks sessions and leaderboard ranking", () => {
    const t = createTeam({ name: "Rank Test", coachId: "c1" });
    const m1 = addTeamMember(t.teamId, { displayName: "High" })!;
    const m2 = addTeamMember(t.teamId, { displayName: "Low" })!;
    const s = createTrainingSession({
      teamId: t.teamId,
      mode: "competitive",
      participantMemberIds: [m1.memberId, m2.memberId],
      scenarioId: "broker-cold-driver-easy",
    });
    completeSessionResults(s.sessionId, [
      {
        memberId: m1.memberId,
        avgScore: 88,
        closingRate: 0.8,
        controlScore: 82,
        improvementDelta: 5,
        scenarioId: "broker-cold-driver-easy",
        won: true,
      },
      {
        memberId: m2.memberId,
        avgScore: 62,
        closingRate: 0.25,
        controlScore: 50,
        improvementDelta: -2,
        scenarioId: "broker-cold-driver-easy",
        won: false,
      },
    ]);
    const board = buildLeaderboard(t.teamId);
    expect(board[0]?.memberId).toBe(m1.memberId);
    expect(board[1]?.memberId).toBe(m2.memberId);
    expect(board[0]?.avgScore).toBeGreaterThan(board[1]?.avgScore ?? 0);
  });
});
