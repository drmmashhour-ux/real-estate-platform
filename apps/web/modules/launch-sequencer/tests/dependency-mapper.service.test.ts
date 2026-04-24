import { describe, expect, it } from "vitest";
import { mapLaunchDependencies } from "../dependency-mapper.service";
import type { LaunchCandidateMarket } from "../launch-sequencer.types";

describe("mapLaunchDependencies", () => {
  it("returns blocking compliance for low compliance readiness", () => {
    const c: LaunchCandidateMarket = {
      marketKey: "X1",
      complianceReadiness: 30,
      localizationReadiness: 60,
    };
    const deps = mapLaunchDependencies("X1", c);
    const comp = deps.find((d) => d.type === "COMPLIANCE");
    expect(comp?.blocking).toBe(true);
  });

  it("returns data fallback for empty market key", () => {
    const deps = mapLaunchDependencies("");
    expect(deps.length).toBeGreaterThan(0);
    expect(deps[0]?.blocking).toBe(true);
  });
});
