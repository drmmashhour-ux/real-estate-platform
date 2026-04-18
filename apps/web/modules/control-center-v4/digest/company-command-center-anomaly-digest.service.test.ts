import { describe, expect, it } from "vitest";
import type { CompanyCommandCenterV3Payload } from "@/modules/control-center-v3/company-command-center-v3.types";
import { buildAnomalyDigest } from "./company-command-center-anomaly-digest.service";
import { minimalV3Payload } from "../test-fixtures/v3-minimal";

describe("buildAnomalyDigest", () => {
  it("returns empty when systems null", () => {
    const p = {
      shared: { systems: null },
    } as unknown as CompanyCommandCenterV3Payload;
    const r = buildAnomalyDigest(p);
    expect(r.items.length).toBe(0);
  });

  it("includes ads note when anomaly present", () => {
    const p = minimalV3Payload();
    if (p.shared.systems) {
      p.shared.systems.ads.anomalyNote = "spike in spend";
    }
    const r = buildAnomalyDigest(p);
    expect(r.items.some((i) => i.system === "ads")).toBe(true);
  });
});
