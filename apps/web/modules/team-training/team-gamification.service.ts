import type { BadgeId, MemberGamification } from "./team.types";
import { loadStore, saveStore } from "./team-storage";

const XP_WIN = 25;
const XP_BASE = 8;

function levelFromXp(xp: number): number {
  return Math.min(50, 1 + Math.floor(xp / 200));
}

export function awardXpForSession(memberId: string, avgScore: number, won: boolean): void {
  const store = loadStore();
  let g = store.gamification[memberId];
  if (!g) {
    g = { memberId, xp: 0, level: 1, badges: [], streakDays: 0 };
    store.gamification[memberId] = g;
  }
  const bonus = Math.min(40, Math.round(avgScore / 4));
  g.xp += XP_BASE + bonus + (won ? XP_WIN : 0);
  g.level = levelFromXp(g.xp);

  const badges = new Set(g.badges);
  if (!badges.has("first_session")) badges.add("first_session");
  if (g.streakDays >= 3) badges.add("streak_3");
  if (g.streakDays >= 7) badges.add("streak_7");
  if (won) badges.add("closer");
  g.badges = [...badges];

  saveStore(store);
}

export function touchStreak(memberId: string): void {
  const store = loadStore();
  let g = store.gamification[memberId];
  if (!g) {
    g = { memberId, xp: 0, level: 1, badges: [], streakDays: 0 };
    store.gamification[memberId] = g;
  }
  const today = new Date().toISOString().slice(0, 10);
  if (g.lastPracticeDate === today) {
    return;
  }
  const y = g.lastPracticeDate;
  if (!y) {
    g.streakDays = 1;
  } else {
    const prev = new Date(y);
    const d = new Date(today);
    const diff = (d.getTime() - prev.getTime()) / (86400 * 1000);
    if (diff <= 1.5) g.streakDays += 1;
    else g.streakDays = 1;
  }
  g.lastPracticeDate = today;
  saveStore(store);
}

export function getGamification(memberId: string): MemberGamification {
  const store = loadStore();
  return (
    store.gamification[memberId] ?? {
      memberId,
      xp: 0,
      level: 1,
      badges: [],
      streakDays: 0,
    }
  );
}

export function badgeLabel(id: BadgeId): string {
  switch (id) {
    case "first_session":
      return "First session";
    case "streak_3":
      return "3-day streak";
    case "streak_7":
      return "7-day streak";
    case "closer":
      return "Closer";
    case "extreme_survivor":
      return "Extreme survivor";
    case "team_player":
      return "Team player";
    default:
      return id;
  }
}
