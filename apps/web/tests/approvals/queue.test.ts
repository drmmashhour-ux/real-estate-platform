import { describe, expect, it } from "vitest";
import type { MarketplaceAutonomyApproval } from "@prisma/client";
import { approvalFromDbRow, payloadForAutonomousAction } from "@/lib/approvals/queue";
import type { AutonomousAction } from "@/lib/autonomy/types";

function row(overrides: Partial<MarketplaceAutonomyApproval>): MarketplaceAutonomyApproval {
  const base = {
    id: "appr-1",
    actionType: "seo_page_generate",
    riskTier: "medium",
    status: "pending",
    payload: {},
    summary: "Test",
    requestedByUserId: null,
    reviewedByUserId: null,
    reviewNote: null,
    executedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
  return { ...base, ...overrides } as MarketplaceAutonomyApproval;
}

describe("approvals queue", () => {
  it("payloadForAutonomousAction nests the action for persistence", () => {
    const action: AutonomousAction = {
      id: "x1",
      type: "content_update",
      payload: { listingId: "L1" },
      risk: "low",
    };
    const p = payloadForAutonomousAction(action, { source: "brain" });
    expect(p.autonomousAction).toEqual(action);
    expect(p.source).toBe("brain");
  });

  it("approvalFromDbRow prefers embedded autonomousAction in payload", () => {
    const embedded: AutonomousAction = {
      id: "emb-1",
      type: "pricing_change",
      payload: { deltaPercent: -5 },
      risk: "medium",
    };
    const item = approvalFromDbRow(
      row({
        id: "db-row",
        actionType: "ignored_when_embedded",
        riskTier: "high",
        payload: payloadForAutonomousAction(embedded),
      }),
    );
    expect(item.action).toEqual(embedded);
    expect(item.id).toBe("db-row");
  });

  it("approvalFromDbRow falls back to row fields when no embedding", () => {
    const item = approvalFromDbRow(
      row({
        actionType: "flag_listing",
        riskTier: "low",
        payload: { reason: "quality" },
      }),
    );
    expect(item.action.type).toBe("flag_listing");
    expect(item.action.risk).toBe("low");
    expect(item.action.payload).toEqual({ reason: "quality" });
  });
});
