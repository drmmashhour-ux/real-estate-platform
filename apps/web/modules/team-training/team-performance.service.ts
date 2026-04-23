import { buildLeaderboard } from "./team-leaderboard.service";
import { listSessionsForTeam } from "./team-session.service";
import { listTeamMembers } from "./team.service";

export type TeamPerformanceSummary = {
  totalSessions: number;
  avgTeamScore: number;
  bestPerformers: { displayName: string; avgScore: number }[];
  weakestSkills: string[];
  trendLabel: string;
};

/** Coach-facing rollup — heuristic tags from session density */
export function buildTeamPerformanceSummary(teamId: string): TeamPerformanceSummary {
  const sessions = listSessionsForTeam(teamId);
  const rows = buildLeaderboard(teamId);
  const totalSessions = sessions.length;

  let sum = 0;
  let n = 0;
  for (const s of sessions) {
    for (const r of s.results) {
      sum += r.avgScore;
      n += 1;
    }
  }
  const avgTeamScore = n ? Math.round(sum / n) : 0;

  const bestPerformers = rows.slice(0, 3).map((r) => ({
    displayName: r.displayName,
    avgScore: r.avgScore,
  }));

  const weakHints: string[] = [];
  for (const s of sessions) {
    for (const r of s.results) {
      if (r.controlScore < 55) weakHints.push("control");
      if (r.closingRate < 0.35) weakHints.push("closing");
      if (r.avgScore < 60) weakHints.push("clarity");
    }
  }
  const freq = new Map<string, number>();
  for (const w of weakHints) freq.set(w, (freq.get(w) ?? 0) + 1);
  const weakestSkills = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  const members = listTeamMembers(teamId).length;
  const trendLabel =
    members > 0 && totalSessions === 0
      ? "Log sessions from training live to populate analytics."
      : rows[0] && rows[0].improvementRate > 0
        ? "Team trending up on rolling improvement."
        : "Keep practicing — improvement tracking updates after each logged session.";

  return {
    totalSessions,
    avgTeamScore,
    bestPerformers,
    weakestSkills: weakestSkills.length ? weakestSkills : ["—"],
    trendLabel,
  };
}
