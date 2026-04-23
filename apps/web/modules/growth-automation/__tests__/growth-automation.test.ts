import { describe, expect, it, beforeEach } from "vitest";

import {
  buildAutomationTrackingStats,
  executeAutomationStep,
  processDueStepsForRun,
  recordMessageClick,
  recordMessageConversion,
  recordMessageOpen,
  recordMessageReply,
  resetGrowthAutomationStoreForTests,
  triggerAutomationFlow,
  listMessages,
} from "@/modules/growth-automation/automation-flow.service";
import { renderEmail } from "@/modules/growth-automation/email.service";
import { renderSms } from "@/modules/growth-automation/sms.service";

describe("growth-automation", () => {
  beforeEach(() => {
    resetGrowthAutomationStoreForTests();
  });

  it("triggerAutomationFlow schedules immediate and delayed steps", () => {
    const run = triggerAutomationFlow(
      "NEW_LEAD",
      "lead-1",
      { intent: "BUYER", name: "Alex", location: "Montreal" },
      new Date("2026-06-01T12:00:00.000Z")
    );
    expect(run.steps.length).toBe(4);
    expect(run.steps[0]!.delay).toBe("immediate");
    expect(run.steps[2]!.delay).toBe("plus_1d");
    expect(run.steps[3]!.delay).toBe("plus_3d");
    expect(new Date(run.steps[2]!.executeAtIso).getTime()).toBeGreaterThan(
      new Date(run.steps[0]!.executeAtIso).getTime()
    );
  });

  it("executeAutomationStep persists message (simulated send)", () => {
    const run = triggerAutomationFlow("BROKER_LEAD", "lead-2", {
      intent: "BROKER",
      name: "Sam",
    });
    const step = run.steps[0]!;
    const msg = executeAutomationStep(step, run);
    expect(msg.body.length).toBeGreaterThan(10);
    expect(msg.channel).toBe("EMAIL");
    expect(listMessages().length).toBe(1);
  });

  it("processDueStepsForRun sends immediate steps when now allows", () => {
    const anchor = new Date("2026-06-01T12:00:00.000Z");
    const run = triggerAutomationFlow(
      "INVESTOR_LEAD",
      "lead-3",
      { intent: "INVESTOR" },
      anchor
    );
    const sent = processDueStepsForRun(run.id, anchor);
    expect(sent.length).toBeGreaterThanOrEqual(1);
    expect(sent[0]!.channel === "EMAIL" || sent[0]!.channel === "SMS").toBe(true);
  });

  it("personalizes email with name and location", () => {
    const { body } = renderEmail("new_lead_welcome", {
      intent: "BUYER",
      name: "Jordan",
      location: "Laval",
    });
    expect(body).toContain("Jordan");
    expect(body).toContain("Laval");
  });

  it("renders compact SMS", () => {
    const t = renderSms("new_lead_sms_ping", {
      intent: "BUYER",
      name: "Taylor Lee",
      location: "QC",
    });
    expect(t.length).toBeLessThan(400);
    expect(t).toContain("Taylor");
  });

  it("tracking stats reflect opens/clicks/reply/conversion", () => {
    const run = triggerAutomationFlow("NEW_LEAD", "lead-4", { intent: "BUYER" });
    const msg = executeAutomationStep(run.steps[0]!, run);
    recordMessageOpen(msg.id);
    recordMessageClick(msg.id);
    recordMessageReply(msg.id);
    recordMessageConversion(msg.id);

    const stats = buildAutomationTrackingStats(listMessages());
    expect(stats.messageCount).toBe(1);
    expect(stats.openRate).toBe(1);
    expect(stats.clickRate).toBe(1);
    expect(stats.replyRate).toBe(1);
    expect(stats.conversionRate).toBe(1);
  });
});
