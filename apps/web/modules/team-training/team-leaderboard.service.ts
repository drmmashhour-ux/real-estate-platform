import type { MemberLeaderboardRow } from "./team.types";
import { listTeamMembers } from "./team.service";
import { loadStore, saveStore } from "./team-storage";

export function recordMemberScores(
  memberId: string,
  avgScore: number,
  closingRate: number,
  controlScore: number,
  improvementDelta: number,
): void {
  const store = loadStore();
  const hist = store.memberScoreHistory[memberId] ?? [];
  hist.push(avgScore);
  store.memberScoreHistory[memberId] = hist.slice(-40);
  saveStore(store);
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

/** Rolling improvement: last third vs first third of score history */
export function improvementRateForMember(memberId: string): number {
  const hist = loadStore().memberScoreHistory[memberId] ?? [];
  if (hist.length < 4) return 0;
  const n = hist.length;
  const third = Math.max(1, Math.floor(n / 3));
  const a = avg(hist.slice(0, third));
  const b = avg(hist.slice(-third));
  return Math.round((b - a) * 10) / 10;
}

/** Aggregate leaderboard for a team — uses session results when present. */
export function buildLeaderboard(teamId: string): MemberLeaderboardRow[] {
  const store = loadStore();
  const members = listTeamMembers(teamId);
  const sessions = Object.values(store.sessions).filter((s) => s.teamId === teamId && s.results?.length);

  const byMember: Record<
    string,
    { scores: number[]; closes: number[]; controls: number[]; improvements: number[]; n: number }
  > = {};

  for (const m of members) {
    byMember[m.memberId] = { scores: [], closes: [], controls: [], improvements: [], n: 0 };
  }

  for (const s of sessions) {
    for (const r of s.results) {
      const bucket = byMember[r.memberId];
      if (!bucket) continue;
      bucket.scores.push(r.avgScore);
      bucket.closes.push(r.closingRate);
      bucket.controls.push(r.controlScore);
      bucket.improvements.push(r.improvementDelta);
      bucket.n += 1;
    }
  }

  const rows: MemberLeaderboardRow[] = members.map((m) => {
    const b = byMember[m.memberId]!;
    const sessionsCount = b.n;
    return {
      rank: 0,
      memberId: m.memberId,
      displayName: m.displayName,
      avgScore: b.scores.length ? Math.round(avg(b.scores)) : 0,
      closingRate: b.closes.length ? avg(b.closes) : 0,
      controlScore: b.controls.length ? Math.round(avg(b.controls)) : 0,
      improvementRate: improvementRateForMember(m.memberId),
      sessionsCount,
    };
  });

  rows.sort((a, b) => {
    const s = b.avgScore - a.avgScore;
    if (s !== 0) return s;
    return b.closingRate - a.closingRate;
  });
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });
  return rows;
}
