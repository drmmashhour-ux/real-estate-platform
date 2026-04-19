import { describe, expect, it } from "vitest";
import { computeGeoMatch } from "../broker-geo-match.service";
import type { BrokerServiceArea } from "@/modules/broker/profile/broker-profile.types";
import type { LeadLocation } from "@/modules/lead/lead-location.types";

function loc(partial: Partial<LeadLocation> & Pick<LeadLocation, "confidenceLevel" | "source">): LeadLocation {
  return {
    country: null,
    province: null,
    city: null,
    area: null,
    postalCode: null,
    lat: null,
    lng: null,
    ...partial,
  };
}

describe("computeGeoMatch", () => {
  it("ranks Quebec City lead above neutral when broker declares Quebec City", () => {
    const lead = loc({
      city: "Quebec City",
      province: "QC",
      confidenceLevel: "high",
      source: "user_input",
    });
    const areas: BrokerServiceArea[] = [
      { city: "Quebec City", area: null, priorityLevel: "primary" },
    ];
    const r = computeGeoMatch(lead, areas);
    expect(r.matchType).toBe("exact_city");
    expect(r.geoScore).toBeGreaterThan(0.5);
    expect(r.explanation.toLowerCase()).toContain("city");
  });

  it("matches Québec aliases for city without fabricating data", () => {
    const lead = loc({
      city: "Québec",
      province: "QC",
      confidenceLevel: "medium",
      source: "user_input",
    });
    const areas: BrokerServiceArea[] = [{ city: "Quebec City", area: null, priorityLevel: "primary" }];
    const r = computeGeoMatch(lead, areas);
    expect(["exact_city", "area_match"]).toContain(r.matchType);
    expect(r.geoScore).toBeGreaterThanOrEqual(0.9);
  });

  it("uses same-region when provinces align but cities differ", () => {
    const lead = loc({
      city: "Sherbrooke",
      province: "QC",
      confidenceLevel: "medium",
      source: "user_input",
    });
    const areas: BrokerServiceArea[] = [{ city: "Montreal", area: null, priorityLevel: "primary" }];
    const r = computeGeoMatch(lead, areas);
    expect(r.matchType).toBe("same_region");
    expect(r.geoScore).toBeGreaterThanOrEqual(0.5);
  });

  it("never returns zero geoScore — fallback floor", () => {
    const lead = loc({
      city: "Vancouver",
      province: "BC",
      confidenceLevel: "high",
      source: "user_input",
    });
    const areas: BrokerServiceArea[] = [{ city: "Halifax", area: null, priorityLevel: "primary" }];
    const r = computeGeoMatch(lead, areas);
    expect(r.geoScore).toBeGreaterThan(0);
    expect(r.matchType).toBe("none");
  });

  it("prefers area_match when neighbourhood aligns", () => {
    const lead = loc({
      city: "Montreal",
      area: "Plateau",
      province: "QC",
      confidenceLevel: "high",
      source: "user_input",
    });
    const areas: BrokerServiceArea[] = [
      { city: "Montreal", area: "Plateau Mont-Royal", priorityLevel: "primary" },
    ];
    const r = computeGeoMatch(lead, areas);
    expect(r.matchType).toBe("area_match");
  });
});
