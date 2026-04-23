import { describe, it, expect, beforeEach } from "vitest";

import { analyzeCoachingSignals } from "../ai-sales-coaching.service";
import {
  forecastPerformance,
} from "../ai-sales-forecast.service";
import {
  computeOverallSalesScore,
  buildSalesManagerSummary,
  refreshUserIntelligence,
} from "../ai-sales-manager.service";
import {
  updateSalesProfileFromTraining,
  updateSalesProfileFromCall,
  getSalesProfile,
  defaultSalesProfile,
  saveSalesProfile,
} from "../ai-sales-profile.service";
import { resetAiSalesStoreForTests } from "../ai-sales-manager-storage";
import { evaluateAlertsForUser } from "../ai-sales-alerts.service";
import { generateCoachingRecommendations } from "../ai-sales-recommendation.service";
import { generateStrategySuggestions } from "../ai-sales-strategy.service";

beforeEach(() => {
  resetAiSalesStoreForTests();
});

describe("sales profile", () => {
  it("updates from training and maintains rolling averages", () => {
    updateSalesProfileFromTraining("user-a", {
      scenarioId: "broker-cold-driver-easy",
      avgScore: 80,
      controlScore: 78,
      closingScore: 72,
      won: true,
      personality: "DRIVER",
      scenarioAudience: "BROKER",
      difficulty: "EASY",
    });
    const p = getSalesProfile("user-a");
    expect(p.trainingSessionCount).toBe(1);
    expect(Math.round(p.averageTrainingScore)).toBe(80);

    updateSalesProfileFromTraining("user-a", {
      scenarioId: "broker-follow-amiable-med",
      avgScore: 70,
      controlScore: 68,
      closingScore: 65,
      won: false,
      personality: "AMIABLE",
      scenarioAudience: "BROKER",
      difficulty: "MEDIUM",
    });
    const p2 = getSalesProfile("user-a");
    expect(p2.trainingSessionCount).toBe(2);
    expect(p2.averageTrainingScore).toBeGreaterThan(69);
    expect(p2.averageTrainingScore).toBeLessThan(76);
  });

  it("updates from call logs", () => {
    updateSalesProfileFromCall("rep-1", {
      demoBooked: true,
      closeLost: false,
      controlScore: 66,
      closingScore: 61,
      objectionsRaised: ["already have leads"],
    });
    const p = getSalesProfile("rep-1");
    expect(p.totalCalls).toBe(1);
    expect(p.demosBooked).toBe(1);
    expect(Object.keys(p.objectionCounts).length).toBeGreaterThan(0);
  });
});

describe("coaching & scoring", () => {
  it("detects weaknesses from thin demo conversion", () => {
    const p = defaultSalesProfile("u-demo");
    p.totalCalls = 12;
    p.demosBooked = 1;
    p.trainingSessionCount = 4;
    p.averageTrainingScore = 72;
    p.personalityAvgScore = { ANALYTICAL: 58 };
    p.personalitySessionCount = { ANALYTICAL: 4 };
    const signals = analyzeCoachingSignals(p);
    expect(signals.weaknesses.length).toBeGreaterThan(0);

    const recs = generateCoachingRecommendations(p, signals);
    expect(recs.every((r) => r.reason.length > 10)).toBe(true);
    expect(recs.some((r) => r.triggers.length > 0)).toBe(true);

    const strategies = generateStrategySuggestions(p);
    expect(strategies[0]?.exampleLine.length).toBeGreaterThan(10);
  });

  it("computes weighted score with explainable factors", () => {
    const p = defaultSalesProfile("score-user");
    p.trainingSessionCount = 10;
    p.averageTrainingScore = 82;
    p.averageControlScore = 76;
    p.averageClosingScore = 74;
    p.totalCalls = 15;
    p.demosBooked = 5;
    p.closesWon = 4;
    p.closesLost = 4;
    p.improvementTrend = "up";

    const sc = computeOverallSalesScore(p);
    expect(sc.overall).toBeGreaterThan(35);
    expect(sc.factors.length).toBeGreaterThanOrEqual(4);
    expect(sc.confidence).toBeGreaterThan(0.28);
  });
});

describe("forecast & manager rollup", () => {
  it("produces bounded probabilistic forecasts", () => {
    updateSalesProfileFromTraining("forecast-user", {
      scenarioId: "broker-skeptical-hard",
      avgScore: 71,
      controlScore: 65,
      closingScore: 63,
      won: false,
      personality: "ANALYTICAL",
      scenarioAudience: "BROKER",
      difficulty: "HARD",
    });
    updateSalesProfileFromCall("forecast-user", {
      demoBooked: false,
      objectionsRaised: ["too expensive"],
      controlScore: 59,
      closingScore: 55,
    });

    const f = forecastPerformance(getSalesProfile("forecast-user"));
    expect(f.current.demoBookingRate).toBeGreaterThanOrEqual(0.05);
    expect(f.current.demoBookingRate).toBeLessThanOrEqual(0.45);
    expect(f.current.confidence).toBeLessThanOrEqual(0.85);

    refreshUserIntelligence("forecast-user");
    const summary = buildSalesManagerSummary();
    expect(summary.totalUsers).toBeGreaterThanOrEqual(1);
  });

  it("fires alerts under stress pattern", () => {
    getSalesProfile("alert-user");
    const p = getSalesProfile("alert-user");
    p.scoreHistory = [82, 80, 79, 55, 52, 50];
    p.objectionCounts = { "already have CRM": 5 };
    p.mostCommonObjections = ["already have CRM"];
    saveSalesProfile(p);
    const alerts = evaluateAlertsForUser(getSalesProfile("alert-user"));
    expect(alerts.some((a) => a.kind === "performance_drop" || a.kind === "objection_spike")).toBe(true);
  });
});
