import { describe, expect, it } from "vitest";
import { toQueueItemDto } from "@/lib/trustgraph/application/dto/queueItemDto";

describe("toQueueItemDto", () => {
  it("computes top severity from signals", () => {
    const dto = toQueueItemDto({
      id: "550e8400-e29b-41d4-a716-446655440000",
      entityType: "LISTING",
      entityId: "lst_1",
      status: "pending",
      overallScore: 50,
      trustLevel: "medium",
      readinessLevel: "partial",
      assignedTo: null,
      updatedAt: new Date(),
      signals: [{ severity: "low" }, { severity: "high" }],
    });
    expect(dto.topSeverity).toBe("high");
  });
});
