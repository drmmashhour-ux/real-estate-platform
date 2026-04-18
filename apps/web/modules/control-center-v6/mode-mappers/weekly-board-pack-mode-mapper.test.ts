import { describe, expect, it } from "vitest";
import { minimalV4Payload } from "@/modules/control-center-v5/test-fixtures/v4-minimal";
import { mapWeeklyBoardPackMode } from "./weekly-board-pack-mode-mapper";

describe("mapWeeklyBoardPackMode", () => {
  it("returns board pack shape grounded in V4", () => {
    const v4 = minimalV4Payload();
    const p = mapWeeklyBoardPackMode(v4, null);
    expect(p.mode).toBe("weekly_board_pack");
    expect(p.executiveSummary).toContain("Weekly board snapshot");
    expect(p.weeklyWins.length).toBeGreaterThan(0);
    expect(p.boardMetrics).toBeDefined();
  });
});
