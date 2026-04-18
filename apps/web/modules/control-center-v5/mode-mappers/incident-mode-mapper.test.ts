import { describe, expect, it } from "vitest";
import { minimalV4Payload } from "../test-fixtures/v4-minimal";
import { mapIncidentMode } from "./incident-mode-mapper";

describe("mapIncidentMode", () => {
  it("returns incident severity", () => {
    const v = mapIncidentMode(minimalV4Payload());
    expect(v.mode).toBe("incident");
    expect(["low", "medium", "high", "critical"]).toContain(v.severity);
  });
});
