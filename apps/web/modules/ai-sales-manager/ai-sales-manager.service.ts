import { listTeamMembers, getTeam } from "@/modules/team-training/team.service";

import type {
  ImprovementOpportunity,
  OverallSalesScore,
  PerformanceForecast,
  SalesAlert,
  SalesManagerSummary,
  SalesProfile,
  TeamPerformanceSummary,
} from "./ai-sales-manager.types";
import { evaluateAlertsForUser, listRecentAlerts } from "./ai-sales-alerts.service";
import { analyzeCoachingSignals } from "./ai-sales-coaching.service";
import { forecastPerformance, getStoredForecast } from "./ai-sales-forecast.service";
import {
  generateCoachingRecommendations,
  persistRecommendations,
} from "./ai-sales-recommendation.service";
import { getSalesProfile, listSalesProfiles } from "./ai-sales-profile.service";
import { generateStrategySuggestions } from "./ai-sales-strategy.service";

/**
 * Weighted composite — components sum to ~100 before confidence scaling.
 */
export function computeOverallSalesScore(profile: SalesProfile): OverallSalesScore {
  const trainingW = 0.28;
  const controlW = 0.22;
  const closingW = 0.22;
  const outcomeW = 0.18;
  const trendW = 0.1;

  const trainingContrib = (profile.averageTrainingScore / 100) * (trainingW * 100);
  const controlContrib = (profile.averageControlScore / 100) * (controlW * 100);
  const closingContrib = (profile.averageClosingScore / 100) * (closingW * 100);

  const denomOut = profile.closesWon + profile.closesLost;
  const winRate = denomOut > 0 ? profile.closesWon / denomOut : 0.35;
  const demoRate = profile.totalCalls > 0 ? profile.demosBooked / profile.totalCalls : 0;
  const outcomeBlend = winRate * 0.55 + Math.min(1, demoRate / 0.35) * 0.45;
  const outcomeContrib = outcomeBlend * (outcomeW * 100);

  const trendAdj =
    profile.improvementTrend === "up" ? 1 : profile.improvementTrend === "down" ? -1 : 0;
  const trendContrib = ((trendAdj + 1) / 2) * (trendW * 100);

  const raw = trainingContrib + controlContrib + closingContrib + outcomeContrib + trendContrib;
  const overall = Math.min(98, Math.max(18, Math.round(raw)));

  const sample =
    Math.min(1, profile.totalCalls / 25) * 0.55 + Math.min(1, profile.trainingSessionCount / 20) * 0.45;
  const confidence = Math.round((0.28 + 0.72 * sample) * 100) / 100;

  return {
    overall,
    confidence,
    factors: [
      {
        label: "Training lab",
        weight: trainingW * 100,
        contribution: Math.round(trainingContrib),
        explanation: `Rolling lab average ~${Math.round(profile.averageTrainingScore)} across ${profile.trainingSessionCount} sessions.`,
      },
      {
        label: "Control",
        weight: controlW * 100,
        contribution: Math.round(controlContrib),
        explanation: `Logged control scores ~${Math.round(profile.averageControlScore)} over ${profile.totalCalls} calls.`,
      },
      {
        label: "Closing mechanics",
        weight: closingW * 100,
        contribution: Math.round(closingContrib),
        explanation: `Closing strength ~${Math.round(profile.averageClosingScore)} from blended logs.`,
      },
      {
        label: "Outcomes",
        weight: outcomeW * 100,
        contribution: Math.round(outcomeContrib),
        explanation: `Win ${Math.round(winRate * 100)}% / demo ${Math.round(demoRate * 100)}% rates from CRM-style logs.`,
      },
      {
        label: "Trend",
        weight: trendW * 100,
        contribution: Math.round(trendContrib),
        explanation: `Trajectory ${profile.improvementTrend} from rolling score windows.`,
      },
    ],
  };
}

export function buildSalesManagerSummary(): SalesManagerSummary {
  const profiles = listSalesProfiles();
  const generatedAtIso = new Date().toISOString();
  if (profiles.length === 0) {
    return {
      generatedAtIso,
      totalUsers: 0,
      aggregate: {
        totalCalls: 0,
        demosBooked: 0,
        closesWon: 0,
        avgTrainingScore: 0,
        avgControlScore: 0,
        avgClosingScore: 0,
        demoRate: 0,
        closeRate: 0,
      },
      topPerformers: [],
      needsSupport: [],
      commonObjections: [],
      coachingOpportunities: [],
      trendSummary: "No profiles yet — ingest training sessions or call outcomes.",
    };
  }

  let totalCalls = 0;
  let demosBooked = 0;
  let closesWon = 0;
  let sumTrain = 0;
  let sumCtl = 0;
  let sumClose = 0;

  const objectionGlob: Record<string, number> = {};

  for (const p of profiles) {
    totalCalls += p.totalCalls;
    demosBooked += p.demosBooked;
    closesWon += p.closesWon;
    sumTrain += p.averageTrainingScore;
    sumCtl += p.averageControlScore;
    sumClose += p.averageClosingScore;
    for (const [k, v] of Object.entries(p.objectionCounts)) {
      objectionGlob[k] = (objectionGlob[k] ?? 0) + v;
    }
  }

  const n = profiles.length;
  const agg = {
    totalCalls,
    demosBooked,
    closesWon,
    avgTrainingScore: Math.round(sumTrain / n),
    avgControlScore: Math.round(sumCtl / n),
    avgClosingScore: Math.round(sumClose / n),
    demoRate: totalCalls ? demosBooked / totalCalls : 0,
    closeRate: profiles.reduce((s, p) => s + p.closesWon + p.closesLost, 0)
      ? closesWon /
        profiles.reduce((s, p) => s + p.closesWon + p.closesLost, 0)
      : 0,
  };

  const scored = profiles.map((p) => ({
    userId: p.userId,
    displayName: p.displayName,
    score: computeOverallSalesScore(p).overall,
    trend: p.improvementTrend,
  }));

  const topPerformers = [...scored].sort((a, b) => b.score - a.score).slice(0, 5).map((x) => ({
    userId: x.userId,
    displayName: x.displayName,
    overallScore: x.score,
  }));

  const needsSupport = [...scored]
    .filter((x) => x.score < 52 || x.trend === "down")
    .sort((a, b) => a.score - b.score)
    .slice(0, 6)
    .map((x) => ({
      userId: x.userId,
      displayName: x.displayName,
      overallScore: x.score,
      reasons: [
        x.score < 52 ? "Composite score below coaching threshold" : "",
        x.trend === "down" ? "Rolling trend negative" : "",
      ].filter(Boolean),
    }));

  const commonObjections = Object.entries(objectionGlob)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));

  const coachingOpportunities = profiles.flatMap((p) => analyzeCoachingSignals(p).trainingPriorityAreas);
  const uniqCoach = [...new Set(coachingOpportunities)].slice(0, 8);

  const up = profiles.filter((p) => p.improvementTrend === "up").length;
  const trendSummary =
    up > profiles.length / 2
      ? "Majority of tracked reps trending up on rolling scores."
      : "Mixed trends — prioritize bottom quartile for manager touchpoints.";

  return {
    generatedAtIso,
    totalUsers: profiles.length,
    aggregate: agg,
    topPerformers,
    needsSupport,
    commonObjections,
    coachingOpportunities: uniqCoach,
    trendSummary,
  };
}

export function buildTeamPerformanceSummary(teamId: string): TeamPerformanceSummary | null {
  const team = getTeam(teamId);
  if (!team) return null;

  const members = listTeamMembers(teamId);
  const profiles = members.map((m) => getSalesProfile(m.memberId));

  let totalCalls = 0;
  let demosBooked = 0;
  let closesWon = 0;
  let sumTrain = 0;
  let sumCtl = 0;
  let sumClose = 0;

  const objectionGlob: Record<string, number> = {};

  for (const p of profiles) {
    totalCalls += p.totalCalls;
    demosBooked += p.demosBooked;
    closesWon += p.closesWon;
    sumTrain += p.averageTrainingScore;
    sumCtl += p.averageControlScore;
    sumClose += p.averageClosingScore;
    for (const [k, v] of Object.entries(p.objectionCounts)) {
      objectionGlob[k] = (objectionGlob[k] ?? 0) + v;
    }
  }

  const n = Math.max(1, profiles.length);
  const aggregate = {
    totalCalls,
    demosBooked,
    closesWon,
    avgTrainingScore: Math.round(sumTrain / n),
    avgControlScore: Math.round(sumCtl / n),
    avgClosingScore: Math.round(sumClose / n),
    demoRate: totalCalls ? demosBooked / totalCalls : 0,
    closeRate: profiles.reduce((s, p) => s + p.closesWon + p.closesLost, 0)
      ? closesWon /
        profiles.reduce((s, p) => s + p.closesWon + p.closesLost, 0)
      : 0,
  };

  const memberRows = members.map((m) => {
    const p = getSalesProfile(m.memberId);
    const weak = analyzeCoachingSignals(p).weaknesses[0];
    return {
      memberId: m.memberId,
      displayName: m.displayName,
      overallScore: computeOverallSalesScore(p).overall,
      trend: p.improvementTrend,
      topWeakness: weak,
    };
  });

  const biggestGaps = [...new Set(memberRows.map((r) => r.topWeakness).filter(Boolean))] as string[];

  return {
    teamId,
    teamName: team.name,
    memberCount: members.length,
    aggregate,
    members: memberRows,
    commonObjections: Object.entries(objectionGlob)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count })),
    biggestGaps: biggestGaps.slice(0, 6),
  };
}

export function buildTopImprovementOpportunities(teamId: string): ImprovementOpportunity[] {
  const team = getTeam(teamId);
  if (!team) return [];
  const members = listTeamMembers(teamId);
  const rows: ImprovementOpportunity[] = [];

  for (const m of members) {
    const p = getSalesProfile(m.memberId);
    const analysis = analyzeCoachingSignals(p);
    const score = computeOverallSalesScore(p).overall;
    const priority = Math.max(0, 100 - score + analysis.weaknesses.length * 5);
    rows.push({
      memberId: m.memberId,
      displayName: m.displayName,
      priority,
      summary: analysis.trainingPriorityAreas[0] ?? "Maintain consistency",
      suggestedScenarioIds: generateCoachingRecommendations(p, analysis)[0]?.suggestedScenarioIds ?? [],
    });
  }

  return rows.sort((a, b) => b.priority - a.priority).slice(0, 12);
}

export function refreshUserIntelligence(userId: string): {
  profile: SalesProfile;
  recommendations: ReturnType<typeof generateCoachingRecommendations>;
  strategies: ReturnType<typeof generateStrategySuggestions>;
  forecast: PerformanceForecast;
  alerts: SalesAlert[];
} {
  const profile = getSalesProfile(userId);
  const analysis = analyzeCoachingSignals(profile);
  const recommendations = generateCoachingRecommendations(profile, analysis);
  persistRecommendations(userId, recommendations);
  const strategies = generateStrategySuggestions(profile);
  const forecast = forecastPerformance(profile);
  const alerts = evaluateAlertsForUser(profile);
  return { profile, recommendations, strategies, forecast, alerts };
}

export { getStoredForecast };

export function buildSalespersonDetailPayload(userId: string) {
  const profile = getSalesProfile(userId);
  const scores = computeOverallSalesScore(profile);
  const coaching = analyzeCoachingSignals(profile);
  const recommendations = generateCoachingRecommendations(profile, coaching);
  const strategies = generateStrategySuggestions(profile);
  let forecast = getStoredForecast(userId);
  if (!forecast) forecast = forecastPerformance(profile);
  const alerts = listRecentAlerts(120).filter((a) => a.userId === userId).slice(0, 12);
  return {
    profile,
    scores,
    coaching,
    recommendations,
    strategies,
    forecast,
    alerts,
  };
}
