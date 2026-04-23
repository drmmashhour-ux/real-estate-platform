import type {
  CallOutcomeUpdate,
  ImprovementTrend,
  SalesProfile,
  TrainingOutcomeUpdate,
} from "./ai-sales-manager.types";
import type { ScenarioPersonality } from "@/modules/training-scenarios/training-scenarios.types";
import { loadAiSalesStore, saveAiSalesStore, uid } from "./ai-sales-manager-storage";

const PERSONALITIES: ScenarioPersonality[] = ["DRIVER", "ANALYTICAL", "EXPRESSIVE", "AMIABLE"];

function bumpCount(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function rollingAvg(prevAvg: number, prevN: number, newValue: number): number {
  const n = prevN + 1;
  return (prevAvg * prevN + newValue) / n;
}

function updateTrendFromScores(history: number[]): ImprovementTrend {
  if (history.length < 4) return "flat";
  const mid = Math.floor(history.length / 2);
  const first = history.slice(0, mid);
  const second = history.slice(mid);
  const a = first.reduce((s, x) => s + x, 0) / first.length;
  const b = second.reduce((s, x) => s + x, 0) / second.length;
  const d = b - a;
  if (d > 3) return "up";
  if (d < -3) return "down";
  return "flat";
}

export function defaultSalesProfile(userId: string): SalesProfile {
  return {
    userId,
    totalCalls: 0,
    demosBooked: 0,
    closesWon: 0,
    closesLost: 0,
    averageTrainingScore: 0,
    averageControlScore: 0,
    averageClosingScore: 0,
    trainingSessionCount: 0,
    mostCommonObjections: [],
    objectionCounts: {},
    strongestPersonalityMatch: null,
    weakestPersonalityMatch: null,
    strongestScenarioType: null,
    weakestScenarioType: null,
    improvementTrend: "flat",
    managerNotes: "",
    lastUpdatedIso: new Date().toISOString(),
    scoreHistory: [],
    personalityAvgScore: {},
    personalitySessionCount: {},
    audienceAvgScore: {},
    audienceSessionCount: {},
    replayAnalysisCount: 0,
    weakMomentSignals: [],
  };
}

export function getSalesProfile(userId: string): SalesProfile {
  const store = loadAiSalesStore();
  const existing = store.profiles[userId];
  if (existing) return existing;
  const created = defaultSalesProfile(userId);
  store.profiles[userId] = created;
  saveAiSalesStore(store);
  return created;
}

export function saveSalesProfile(profile: SalesProfile): void {
  const store = loadAiSalesStore();
  profile.lastUpdatedIso = new Date().toISOString();
  store.profiles[profile.userId] = profile;
  saveAiSalesStore(store);
}

function recomputeObjectionRankings(p: SalesProfile): void {
  const entries = Object.entries(p.objectionCounts).sort((a, b) => b[1] - a[1]);
  p.mostCommonObjections = entries.slice(0, 8).map(([k]) => k);
}

function recomputePersonalityStrength(p: SalesProfile): void {
  let best: ScenarioPersonality | null = null;
  let worst: ScenarioPersonality | null = null;
  let bestSc = -1;
  let worstSc = 999;
  for (const pers of PERSONALITIES) {
    const n = p.personalitySessionCount[pers] ?? 0;
    if (n < 1) continue;
    const sc = p.personalityAvgScore[pers] ?? 0;
    if (sc > bestSc) {
      bestSc = sc;
      best = pers;
    }
    if (sc < worstSc) {
      worstSc = sc;
      worst = pers;
    }
  }
  p.strongestPersonalityMatch = best;
  p.weakestPersonalityMatch = worst;

  const br = p.audienceSessionCount.BROKER ?? 0;
  const inv = p.audienceSessionCount.INVESTOR ?? 0;
  const bAvg = p.audienceAvgScore.BROKER;
  const iAvg = p.audienceAvgScore.INVESTOR;
  if (br > 0 && inv > 0 && typeof bAvg === "number" && typeof iAvg === "number") {
    p.strongestScenarioType = bAvg >= iAvg ? "BROKER" : "INVESTOR";
    p.weakestScenarioType = bAvg >= iAvg ? "INVESTOR" : "BROKER";
  } else if (br > 0 && inv === 0) {
    p.strongestScenarioType = "BROKER";
    p.weakestScenarioType = "BROKER";
  } else if (inv > 0 && br === 0) {
    p.strongestScenarioType = "INVESTOR";
    p.weakestScenarioType = "INVESTOR";
  }
}

/**
 * Ingest real call outcomes (logged by rep/manager — never auto-dialed).
 */
export function updateSalesProfileFromCall(userId: string, callData: CallOutcomeUpdate): SalesProfile {
  const p = getSalesProfile(userId);
  p.totalCalls += 1;
  if (callData.demoBooked) p.demosBooked += 1;
  if (callData.closeWon) p.closesWon += 1;
  if (callData.closeLost) p.closesLost += 1;

  if (typeof callData.controlScore === "number") {
    p.averageControlScore = rollingAvg(p.averageControlScore, Math.max(0, p.totalCalls - 1), callData.controlScore);
  }
  if (typeof callData.closingScore === "number") {
    p.averageClosingScore = rollingAvg(p.averageClosingScore, Math.max(0, p.totalCalls - 1), callData.closingScore);
  }

  const pers = callData.clientPersonalityHint ?? callData.scenarioPersonality;
  if (pers && typeof callData.controlScore === "number") {
    const prevN = p.personalitySessionCount[pers] ?? 0;
    const n = prevN + 1;
    const prevAvg = p.personalityAvgScore[pers] ?? callData.controlScore;
    p.personalityAvgScore[pers] = rollingAvg(prevAvg, prevN, callData.controlScore);
    p.personalitySessionCount[pers] = n;
  }

  for (const o of callData.objectionsRaised ?? []) {
    const key = o.trim().slice(0, 80) || "unknown_objection";
    bumpCount(p.objectionCounts, key);
  }
  recomputeObjectionRankings(p);
  recomputePersonalityStrength(p);

  const composite = (callData.controlScore ?? p.averageControlScore) * 0.5 + (callData.closingScore ?? p.averageClosingScore) * 0.5;
  if (Number.isFinite(composite)) {
    p.scoreHistory.push(Math.min(100, Math.max(0, composite)));
    if (p.scoreHistory.length > 24) p.scoreHistory = p.scoreHistory.slice(-24);
    p.improvementTrend = updateTrendFromScores(p.scoreHistory);
  }

  saveSalesProfile(p);
  return p;
}

/**
 * Merge training lab / team training session results.
 */
export function updateSalesProfileFromTraining(userId: string, trainingData: TrainingOutcomeUpdate): SalesProfile {
  const p = getSalesProfile(userId);
  const n = p.trainingSessionCount + 1;
  p.trainingSessionCount = n;
  p.averageTrainingScore = rollingAvg(p.averageTrainingScore, n - 1, trainingData.avgScore);
  p.averageControlScore = rollingAvg(p.averageControlScore, n - 1, trainingData.controlScore);
  p.averageClosingScore = rollingAvg(p.averageClosingScore, n - 1, trainingData.closingScore);

  const pers = trainingData.personality;
  if (pers) {
    const cn = (p.personalitySessionCount[pers] ?? 0) + 1;
    p.personalitySessionCount[pers] = cn;
    const prev = p.personalityAvgScore[pers] ?? trainingData.avgScore;
    p.personalityAvgScore[pers] = rollingAvg(prev, cn - 1, trainingData.avgScore);
  }

  const aud = trainingData.scenarioAudience;
  if (aud) {
    const cn = (p.audienceSessionCount[aud] ?? 0) + 1;
    p.audienceSessionCount[aud] = cn;
    const prev = p.audienceAvgScore[aud] ?? trainingData.avgScore;
    p.audienceAvgScore[aud] = rollingAvg(prev, cn - 1, trainingData.avgScore);
  }

  p.scoreHistory.push(
    Math.min(100, trainingData.avgScore * 0.5 + trainingData.controlScore * 0.25 + trainingData.closingScore * 0.25),
  );
  if (p.scoreHistory.length > 24) p.scoreHistory = p.scoreHistory.slice(-24);
  p.improvementTrend = updateTrendFromScores(p.scoreHistory);

  recomputePersonalityStrength(p);
  saveSalesProfile(p);
  return p;
}

export function updateManagerNotes(userId: string, notes: string): SalesProfile {
  const p = getSalesProfile(userId);
  p.managerNotes = notes.trim();
  saveSalesProfile(p);
  return p;
}

export function listSalesProfiles(): SalesProfile[] {
  return Object.values(loadAiSalesStore().profiles).sort((a, b) => b.lastUpdatedIso.localeCompare(a.lastUpdatedIso));
}

export function ingestReplayWeakSignals(userId: string, signals: string[]): SalesProfile {
  const p = getSalesProfile(userId);
  p.replayAnalysisCount += 1;
  const set = new Set([...p.weakMomentSignals, ...signals.map((s) => s.slice(0, 120))]);
  p.weakMomentSignals = [...set].slice(-40);
  saveSalesProfile(p);
  return p;
}

export function appendAssignment(record: Omit<AssignmentRecord, "assignmentId" | "assignedAtIso">): AssignmentRecord {
  const store = loadAiSalesStore();
  const row: AssignmentRecord = {
    assignmentId: uid(),
    assignedAtIso: new Date().toISOString(),
    ...record,
  };
  store.assignments.push(row);
  saveAiSalesStore(store);
  return row;
}
