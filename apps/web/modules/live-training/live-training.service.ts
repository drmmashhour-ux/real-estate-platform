import type {
  AggregateProgress,
  LiveFeedbackResult,
  LivePersonaType,
  SessionSummary,
  StoredSessionRecord,
} from "./live-training.types";

export {
  appendUserTurn,
  configForPersona,
  personaOpening,
  startLiveSession,
} from "./live-simulation.engine";

const STORAGE_SESSIONS = "lecipm-live-training-sessions-v1";
const STORAGE_AGG = "lecipm-live-training-aggregate-v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveSessionRecord(summary: SessionSummary): void {
  if (typeof localStorage === "undefined") return;
  const prev = safeParse<StoredSessionRecord[]>(localStorage.getItem(STORAGE_SESSIONS), []);
  const row: StoredSessionRecord = {
    summary,
    savedAtIso: new Date().toISOString(),
  };
  const next = [...prev, row].slice(-40);
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(next));

  const agg = loadAggregateProgress();
  const n = agg.sessionCount + 1;
  const rolling =
    n <= 1
      ? summary.averageScore
      : (agg.rollingAverageScore * (n - 1) + summary.averageScore) / n;
  const updated: AggregateProgress = {
    sessionCount: n,
    rollingAverageScore: Math.round(rolling * 10) / 10,
    lastPersona: summary.personaType,
  };
  localStorage.setItem(STORAGE_AGG, JSON.stringify(updated));
}

export function loadStoredSessions(): StoredSessionRecord[] {
  if (typeof localStorage === "undefined") return [];
  return safeParse<StoredSessionRecord[]>(localStorage.getItem(STORAGE_SESSIONS), []);
}

export function loadAggregateProgress(): AggregateProgress {
  if (typeof localStorage === "undefined") {
    return { sessionCount: 0, rollingAverageScore: 0, lastPersona: null };
  }
  return safeParse(localStorage.getItem(STORAGE_AGG), {
    sessionCount: 0,
    rollingAverageScore: 0,
    lastPersona: null,
  });
}

/** Unlock harder personas as rolling average improves (first sessions get full roster to learn pacing). */
export function unlockedLivePersonas(rollingAvg: number, sessionCount = 0): LivePersonaType[] {
  const all: LivePersonaType[] = ["driver_broker", "analytical_investor", "expressive_user", "amiable_client"];
  if (sessionCount < 3) return all;
  const list: LivePersonaType[] = ["driver_broker", "analytical_investor"];
  if (rollingAvg >= 52) list.push("expressive_user");
  if (rollingAvg >= 65) list.push("amiable_client");
  return list;
}

export function paceLevelFromRollingAvg(rollingAvg: number): number {
  if (rollingAvg >= 78) return 4;
  if (rollingAvg >= 65) return 3;
  if (rollingAvg >= 52) return 2;
  return 1;
}

export function buildSessionSummary(
  personaType: LivePersonaType,
  gradedTurns: { text: string; feedback: LiveFeedbackResult }[],
  sessionId: string,
  scenarioId?: string,
): SessionSummary {
  const scores = gradedTurns.map((t) => t.feedback.score);
  const total = scores.reduce((a, b) => a + b, 0);
  const avg = scores.length ? Math.round(total / scores.length) : 0;

  const mistakeTags = gradedTurns.flatMap((t) => t.feedback.tags);
  const freq = new Map<string, number>();
  for (const tag of mistakeTags) {
    if (tag === "good_framing" || tag === "strong_close" || tag === "asks_question") continue;
    freq.set(tag, (freq.get(tag) ?? 0) + 1);
  }
  const topMistakes = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag.replace(/_/g, " "));

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (mistakeTags.filter((t) => t === "good_framing").length >= 2) strengths.push("Consistent framing under pressure.");
  if (mistakeTags.filter((t) => t === "strong_close").length >= 1) strengths.push("Closed with concrete next steps at least once.");
  if (freq.has("too_long")) weaknesses.push("Trim answers — aim for two tight sentences before the ask.");
  if (freq.has("weak_close")) weaknesses.push("Replace hedging language with time-bound asks.");
  if (freq.has("no_control")) weaknesses.push("Acknowledge tension, then redirect to a demo or proof.");
  if (strengths.length === 0) strengths.push("Completed a high-pressure rhythm — repeat with the same prep.");
  if (weaknesses.length === 0) weaknesses.push("Watch filler and keep the close specific.");

  const bestLines = gradedTurns
    .filter((t) => t.feedback.score >= 82)
    .map((t) => t.text)
    .slice(0, 3);

  return {
    sessionId,
    personaType,
    ...(scenarioId ? { scenarioId } : {}),
    endedAtIso: new Date().toISOString(),
    averageScore: avg,
    totalScore: total,
    turnsGraded: scores.length,
    strengths,
    weaknesses,
    topMistakes,
    bestLines,
  };
}

export function exportSessionsJson(): string {
  const rows = loadStoredSessions();
  return JSON.stringify(rows, null, 2);
}
