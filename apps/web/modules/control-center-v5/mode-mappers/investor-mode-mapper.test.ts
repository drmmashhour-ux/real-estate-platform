import { describe, expect, it } from "vitest";
import { minimalV4Payload } from "../test-fixtures/v4-minimal";
import { mapInvestorMode } from "./investor-mode-mapper";

describe("mapInvestorMode", () => {
  it("grounds summary in aggregate meta", () => {
    const v = mapInvestorMode(minimalV4Payload());
    expect(v.mode).toBe("investor");
    expect(v.companySummary).toContain("Governance snapshot");
  });
});
