import { describe, expect, it } from "vitest";
import { buildRationaleLines, blocksToRationaleText } from "../utils/playbook-memory-rationale";

describe("playbook-memory-rationale", () => {
  it("buildRationaleLines includes band and mode", () => {
    const lines = buildRationaleLines({
      rankScore: 0.77,
      domain: "LEADS",
      totalExecutions: 40,
      scoreBand: "HIGH",
      executionMode: "HUMAN_APPROVAL",
    });
    expect(lines.join(" ")).toContain("rank_score=0.7700");
    expect(lines.some((l) => l.includes("HUMAN_APPROVAL"))).toBe(true);
  });

  it("blocksToRationaleText labels blocks", () => {
    const t = blocksToRationaleText(["policy_critical_block"]);
    expect(t[0]).toContain("blocked:policy_critical_block");
  });
});
