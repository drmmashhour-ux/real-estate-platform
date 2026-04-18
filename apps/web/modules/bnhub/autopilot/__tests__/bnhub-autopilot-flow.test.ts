import { describe, it, expect, vi, beforeEach } from "vitest";
import { approveBnHubAutopilotAction, rejectBnHubAutopilotAction } from "../bnhub-autopilot-approval.service";
import {
  getBnhubAutopilotAction,
  putBnhubAutopilotAction,
  resetBnhubAutopilotStoreForTests,
} from "../bnhub-autopilot-store.service";
import { resetBnhubAutopilotMonitoringForTests } from "../bnhub-autopilot-monitoring.service";
import { resetBnhubAutopilotRollbackForTests, getRollbackSnapshot } from "../bnhub-autopilot-rollback.service";
import type { BNHubAutopilotAction } from "../bnhub-autopilot.types";

vi.mock("@/config/feature-flags", () => ({
  bnhubAutopilotExecutionFlags: {
    autopilotV1: true,
    executionV1: true,
    rollbackV1: true,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    shortTermListing: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { executeBnHubAutopilotAction, executeApprovedBNHubActions } from "../bnhub-autopilot-execution.service";
import { rollbackBNHubAction } from "../bnhub-autopilot-rollback.service";
import { buildBNHubAutopilotActions } from "../bnhub-autopilot-actions.builder";

vi.mock("@/modules/bnhub/mission-control/mission-control.service", () => ({
  buildBNHubMissionControl: vi.fn(),
}));

vi.mock("@/modules/bnhub/guest-conversion/guest-conversion.service", () => ({
  buildGuestConversionSummary: vi.fn(),
}));

vi.mock("@/modules/bnhub/host-performance/host-performance.service", () => ({
  buildHostPerformanceSummary: vi.fn(),
}));

import { buildBNHubMissionControl } from "@/modules/bnhub/mission-control/mission-control.service";
import { buildGuestConversionSummary } from "@/modules/bnhub/guest-conversion/guest-conversion.service";
import { buildHostPerformanceSummary } from "@/modules/bnhub/host-performance/host-performance.service";

function sampleTitleAction(listingId: string, id = "act_title_1"): BNHubAutopilotAction {
  return {
    id,
    listingId,
    type: "IMPROVE_TITLE",
    payload: {
      kind: "title",
      proposedTitle: "Better title for guests",
      reason: "test",
    },
    status: "pending",
    reversible: true,
    createdAt: new Date().toISOString(),
    why: "test",
    impact: "high",
  };
}

describe("BNHub autopilot approval", () => {
  beforeEach(() => {
    resetBnhubAutopilotStoreForTests();
    resetBnhubAutopilotMonitoringForTests();
  });

  it("approves only when pending", () => {
    const a = sampleTitleAction("lst_1");
    putBnhubAutopilotAction(a);
    expect(approveBnHubAutopilotAction(a.id).ok).toBe(true);
    expect(getBnhubAutopilotAction(a.id)?.status).toBe("approved");
    expect(approveBnHubAutopilotAction(a.id).ok).toBe(false);
  });

  it("rejects only when pending", () => {
    const a = sampleTitleAction("lst_1", "act_r1");
    putBnhubAutopilotAction(a);
    expect(rejectBnHubAutopilotAction(a.id).ok).toBe(true);
    expect(getBnhubAutopilotAction(a.id)?.status).toBe("rejected");
  });
});

describe("BNHub autopilot execution (safe filter)", () => {
  beforeEach(() => {
    resetBnhubAutopilotStoreForTests();
    resetBnhubAutopilotRollbackForTests();
    resetBnhubAutopilotMonitoringForTests();
    vi.clearAllMocks();
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue({
      id: "lst_1",
      title: "Old",
      description: "d",
      amenities: [],
    } as never);
    vi.mocked(prisma.shortTermListing.update).mockResolvedValue({} as never);
  });

  it("executes IMPROVE_TITLE when approved", async () => {
    const a = sampleTitleAction("lst_1", "ex1");
    putBnhubAutopilotAction({ ...a, status: "approved" });
    const r = await executeBnHubAutopilotAction("ex1");
    expect(r.ok).toBe(true);
    expect(getBnhubAutopilotAction("ex1")?.status).toBe("executed");
    expect(prisma.shortTermListing.update).toHaveBeenCalled();
    expect(getRollbackSnapshot("ex1")?.field).toBe("title");
  });

  it("refuses PRICING_SUGGESTION execution", async () => {
    putBnhubAutopilotAction({
      id: "price1",
      listingId: "lst_1",
      type: "PRICING_SUGGESTION",
      payload: { kind: "pricing", note: "x", reason: "r" },
      status: "approved",
      reversible: false,
      createdAt: new Date().toISOString(),
      why: "x",
      impact: "high",
    });
    const r = await executeBnHubAutopilotAction("price1");
    expect(r.ok).toBe(false);
    expect(r.error).toBe("not_executable");
  });

  it("executeApprovedBNHubActions skips non-approved and non-executable", async () => {
    putBnhubAutopilotAction({
      ...sampleTitleAction("lst_1", "b1"),
      status: "approved",
    });
    putBnhubAutopilotAction({
      id: "b2",
      listingId: "lst_1",
      type: "PRICING_SUGGESTION",
      payload: { kind: "pricing", note: "n", reason: "r" },
      status: "approved",
      reversible: false,
      createdAt: new Date().toISOString(),
      why: "x",
      impact: "low",
    });
    const out = await executeApprovedBNHubActions("lst_1");
    expect(out.executed).toBe(1);
    expect(out.skipped).toBeGreaterThanOrEqual(1);
  });
});

describe("BNHub autopilot rollback", () => {
  beforeEach(() => {
    resetBnhubAutopilotStoreForTests();
    resetBnhubAutopilotRollbackForTests();
    vi.clearAllMocks();
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue({
      id: "lst_1",
      title: "Old",
      description: null,
      amenities: [],
    } as never);
    vi.mocked(prisma.shortTermListing.update).mockResolvedValue({} as never);
  });

  it("restores snapshot and updates action status", async () => {
    const a = sampleTitleAction("lst_1", "rb1");
    putBnhubAutopilotAction({ ...a, status: "approved" });
    await executeBnHubAutopilotAction("rb1");
    expect(getRollbackSnapshot("rb1")).toBeDefined();
    const r = await rollbackBNHubAction("rb1");
    expect(r.ok).toBe(true);
    expect(getRollbackSnapshot("rb1")).toBeUndefined();
    expect(getBnhubAutopilotAction("rb1")?.status).toBe("rejected");
  });

  it("fails rollback when not executed", async () => {
    putBnhubAutopilotAction({ ...sampleTitleAction("lst_1", "rb2"), status: "approved" });
    const r = await rollbackBNHubAction("rb2");
    expect(r.ok).toBe(false);
  });
});

describe("buildBNHubAutopilotActions", () => {
  beforeEach(() => {
    resetBnhubAutopilotStoreForTests();
    resetBnhubAutopilotMonitoringForTests();
    vi.clearAllMocks();
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue({
      id: "lst_mc",
      title: "Hi",
      description: "short",
      amenities: [],
      ownerId: "own_1",
      photos: [],
      nightPriceCents: 10000,
    } as never);
    vi.mocked(buildBNHubMissionControl).mockResolvedValue({
      topRisks: ["title clarity"],
      pricingSignal: "elevated_vs_cohort",
      trustScore: 30,
    } as never);
    vi.mocked(buildGuestConversionSummary).mockResolvedValue({
      status: "weak",
    } as never);
    vi.mocked(buildHostPerformanceSummary).mockResolvedValue({
      listings: [
        {
          listingId: "lst_mc",
          weakSignals: ["description"],
        },
      ],
    } as never);
  });

  it("returns at most 5 actions and registers pending", async () => {
    const actions = await buildBNHubAutopilotActions("lst_mc");
    expect(actions.length).toBeLessThanOrEqual(5);
    expect(actions.every((a) => a.status === "pending")).toBe(true);
    const stored = getBnhubAutopilotAction(actions[0]!.id);
    expect(stored?.listingId).toBe("lst_mc");
  });
});
