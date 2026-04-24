import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    actionPipeline: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import {
  assertExecutedAutopilotPipelineForOfferSend,
  assertOfferSendSignatureGate,
  offerSendRequiresExecutedAutopilotPipeline,
} from "../action-pipeline-guard";

describe("action-pipeline-guard", () => {
  beforeEach(() => {
    vi.mocked(prisma.actionPipeline.findFirst).mockReset();
    delete process.env.SIGNATURE_CONTROL_REQUIRE_EXECUTED_PIPELINE_FOR_OFFER_SEND;
  });

  it("assertOfferSendSignatureGate no-ops when pipeline not required and id omitted", async () => {
    await expect(assertOfferSendSignatureGate({ dealId: "d1", autopilotActionPipelineId: null })).resolves.toBeUndefined();
  });

  it("assertOfferSendSignatureGate requires id when env strict", async () => {
    process.env.SIGNATURE_CONTROL_REQUIRE_EXECUTED_PIPELINE_FOR_OFFER_SEND = "1";
    expect(offerSendRequiresExecutedAutopilotPipeline()).toBe(true);
    await expect(assertOfferSendSignatureGate({ dealId: "d1", autopilotActionPipelineId: null })).rejects.toThrow(
      /AUTOPILOT_EXECUTED_PIPELINE_REQUIRED/,
    );
  });

  it("assertExecutedAutopilotPipelineForOfferSend enforces EXECUTED + types", async () => {
    vi.mocked(prisma.actionPipeline.findFirst).mockResolvedValue({
      status: "READY_FOR_SIGNATURE",
      type: "DEAL",
      aiGenerated: true,
    } as never);
    await expect(
      assertExecutedAutopilotPipelineForOfferSend({ dealId: "d1", autopilotActionPipelineId: "p1" }),
    ).rejects.toThrow(/AUTOPILOT_PIPELINE_NOT_EXECUTED/);

    vi.mocked(prisma.actionPipeline.findFirst).mockResolvedValue({
      status: "EXECUTED",
      type: "INVESTMENT",
      aiGenerated: true,
    } as never);
    await expect(
      assertExecutedAutopilotPipelineForOfferSend({ dealId: "d1", autopilotActionPipelineId: "p1" }),
    ).rejects.toThrow(/AUTOPILOT_PIPELINE_WRONG_TYPE_FOR_OFFER_SEND/);
  });
});
