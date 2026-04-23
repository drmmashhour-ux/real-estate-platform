import { describe, expect, it } from "vitest";

import { getLiveAssist } from "../call-live.service";
import { buildCallPerformanceVm } from "../call-performance.service";
import { scoreTrainingReply } from "../training-feedback.service";
import {
  createInitialTurnState,
  listPersonasForLevel,
  startSimulation,
  stepSimulation,
} from "../training-simulation.service";
import type { ScriptConversionStats } from "@/modules/sales-scripts/sales-script.types";

describe("training simulation", () => {
  it("starts with persona-first line", () => {
    const s = startSimulation("broker_busy");
    expect(s.firstClientMessage.length).toBeGreaterThan(10);
    expect(s.persona.difficulty).toBeGreaterThan(0);
  });

  it("steps simulation until exhaustion", () => {
    let state = createInitialTurnState("investor_curious", startSimulation("investor_curious").firstClientMessage);
    expect(state.clientMessages.length).toBe(1);

    let steps = 0;
    while (!state.ended && steps < 20) {
      const step = stepSimulation(state, "Thanks — explain how routing works briefly.");
      state = step.state;
      steps++;
    }
    expect(state.ended).toBe(true);
  });

  it("gates personas by training level", () => {
    const novice = listPersonasForLevel("beginner");
    const elite = listPersonasForLevel("elite");
    expect(novice.length).toBeLessThan(elite.length);
  });
});

describe("training feedback", () => {
  it("scores a reply", () => {
    const fb = scoreTrainingReply(
      "Fair question — in one minute: we route inbound intent to your CRM without cold lists. Can I show a 5-minute flow?",
      startSimulation("broker_skeptical").persona,
      { stage: "pitch", discoveryIndex: 0 },
    );
    expect(fb.overallScore).toBeGreaterThanOrEqual(30);
    expect(fb.overallScore).toBeLessThanOrEqual(100);
    expect(fb.strengths.length).toBeGreaterThan(0);
  });
});

describe("live assist", () => {
  it("returns suggestions", () => {
    const r = getLiveAssist({
      transcript: "",
      lastClientSentence: "Not interested",
      audience: "BROKER",
      scriptCategory: "cold_call_broker",
      stage: "pitch",
    });
    expect(r.suggested.length).toBeGreaterThan(15);
    expect(r.alternatives.length).toBeGreaterThan(0);
  });
});

describe("performance vm", () => {
  it("aggregates conversion stats", () => {
    const stats: ScriptConversionStats = {
      byCategory: {
        cold_call_broker: { total: 20, byOutcome: { DEMO: 5, LOST: 3 } },
      },
      topObjections: [{ label: "busy", count: 4 }],
    };
    const vm = buildCallPerformanceVm(stats, 30);
    expect(vm.callsLogged).toBe(20);
    expect(vm.demosBooked).toBe(5);
    expect(vm.topObjections[0]?.label).toBe("busy");
  });
});
