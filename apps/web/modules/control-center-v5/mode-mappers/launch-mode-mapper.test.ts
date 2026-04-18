import { describe, expect, it } from "vitest";
import { minimalV4Payload } from "../test-fixtures/v4-minimal";
import { mapLaunchMode } from "./launch-mode-mapper";

describe("mapLaunchMode", () => {
  it("returns launch readiness", () => {
    const v = mapLaunchMode(minimalV4Payload());
    expect(v.mode).toBe("launch");
    expect(["go", "caution", "hold"]).toContain(v.launchReadiness);
  });
});
