/**
 * Integration-style tests with mocked DB — verifies orchestration wiring without Postgres.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    fsboListing: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    lead: { findUnique: vi.fn().mockResolvedValue(null) },
    adsAutomationCampaignResult: { findFirst: vi.fn().mockResolvedValue(null) },
    autonomousMarketplaceRun: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "run1" }),
    },
    autonomousMarketplacePolicyRecord: { create: vi.fn().mockResolvedValue({}) },
    autonomousMarketplaceOutcomeRecord: { create: vi.fn().mockResolvedValue({}) },
    autonomousMarketplaceAction: {},
    autonomyExecutionAuditLog: { create: vi.fn().mockResolvedValue({}) },
    autonomyPendingActionApproval: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "ap1" }),
    },
  },
}));

vi.mock("@/config/feature-flags", () => ({
  engineFlags: {
    autonomousMarketplaceV1: true,
    controlledExecutionV1: false,
    autonomyApprovalsV1: false,
    autopilotHardeningV1: false,
  },
}));

describe("AutonomousMarketplaceEngine", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when listing missing", async () => {
    const { autonomousMarketplaceEngine } = await import("../execution/autonomous-marketplace.engine");
    await expect(autonomousMarketplaceEngine.runForListing("missing")).rejects.toThrow();
  });
});
