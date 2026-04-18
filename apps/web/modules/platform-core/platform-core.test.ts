import { describe, it, expect } from "vitest";
import { entityTypeForAction, decisionStatusFromAssistant } from "./platform-ingest-mapping";
import type { AssistantRecommendation } from "@/modules/operator/operator.types";
import { runPlatformExecution } from "./platform-execution.adapter";

describe("platform-ingest-mapping", () => {
  it("maps entity types for actions", () => {
    expect(entityTypeForAction("SCALE_CAMPAIGN")).toBe("CAMPAIGN");
    expect(entityTypeForAction("BOOST_LISTING")).toBe("LISTING");
  });

  it("monitoring status for MONITOR", () => {
    const r = {
      actionType: "MONITOR",
    } as AssistantRecommendation;
    expect(decisionStatusFromAssistant(r)).toBe("MONITORING");
  });
});

describe("platform-execution.adapter", () => {
  it("returns structured internal result for scale", async () => {
    const d = {
      id: "1",
      source: "ADS" as const,
      entityType: "CAMPAIGN" as const,
      entityId: "c1",
      title: "t",
      summary: "s",
      reason: "r",
      confidenceScore: 0.8,
      status: "APPROVED" as const,
      actionType: "SCALE_CAMPAIGN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const out = await runPlatformExecution(d);
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.result.handler).toBe("mark_campaign_ready_to_scale");
  });

  it("blocked decision would not reach adapter in service — adapter assumes valid record shape", async () => {
    const out = await runPlatformExecution({
      id: "2",
      source: "MARKETPLACE",
      entityType: "LISTING",
      entityId: "L1",
      title: "t",
      summary: "s",
      reason: "r",
      confidenceScore: 0.5,
      status: "BLOCKED",
      actionType: "BOOST_LISTING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(out.ok).toBe(true);
  });
});
