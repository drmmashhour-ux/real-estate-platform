import { describe, expect, it } from "vitest";
import {
  PROFILE_ROUTING_SCORE_DELTA_CAP,
  computeProfileRoutingBonus,
  inferLeadIntentCategory,
  inferPropertyBucketFromLead,
} from "../broker-profile-routing-bonus.service";
import { emptyStoredProfile } from "../broker-profile-payload";
import type { BrokerServiceProfileStored } from "../broker-profile.types";

describe("computeProfileRoutingBonus", () => {
  it("returns bounded delta when profile is empty (neutral baseline + small capacity hint)", () => {
    const declared = emptyStoredProfile();
    const r = computeProfileRoutingBonus({
      declared,
      observed: null,
      leadCtx: { city: "Geneva", area: null, propertyTypeBucket: null, intentCategory: null, leadLocale: null },
      profileConfidence: "low",
      activeLeadCount: 5,
    });
    expect(Math.abs(r.delta)).toBeLessThanOrEqual(PROFILE_ROUTING_SCORE_DELTA_CAP);
    expect(r.hints.profileConfidenceNote?.toLowerCase()).toContain("sparse");
  });

  it("boosts score for primary service area match with explanation", () => {
    const declared: BrokerServiceProfileStored = {
      ...emptyStoredProfile(),
      serviceAreas: [{ city: "Geneva", area: null, priorityLevel: "primary" }],
    };
    const r = computeProfileRoutingBonus({
      declared,
      observed: null,
      leadCtx: { city: "geneva", area: null, propertyTypeBucket: null, intentCategory: null, leadLocale: null },
      profileConfidence: "high",
      activeLeadCount: 4,
    });
    expect(r.delta).toBeGreaterThan(0);
    expect(r.reasons.join(" ").toLowerCase()).toContain("service area");
    expect(r.hints.serviceAreaMatch).toBeTruthy();
    expect(r.delta).toBeLessThanOrEqual(PROFILE_ROUTING_SCORE_DELTA_CAP);
  });

  it("boosts for specialization match with capped delta", () => {
    const declared: BrokerServiceProfileStored = {
      ...emptyStoredProfile(),
      specializations: [
        { propertyType: "rental", confidenceSource: "self_declared", enabled: true },
      ],
    };
    const r = computeProfileRoutingBonus({
      declared,
      observed: null,
      leadCtx: {
        city: null,
        area: null,
        propertyTypeBucket: "rental",
        intentCategory: null,
        leadLocale: null,
      },
      profileConfidence: "high",
      activeLeadCount: 2,
    });
    expect(r.delta).toBeGreaterThan(0);
    expect(r.hints.specializationMatch).toContain("rental");
    expect(r.delta).toBeLessThanOrEqual(PROFILE_ROUTING_SCORE_DELTA_CAP);
  });

  it("scales down bonuses when profile confidence is low (sparse)", () => {
    const rich: BrokerServiceProfileStored = {
      ...emptyStoredProfile(),
      serviceAreas: [{ city: "Zurich", priorityLevel: "primary", area: null }],
      specializations: [{ propertyType: "condo", confidenceSource: "self_declared", enabled: true }],
    };
    const high = computeProfileRoutingBonus({
      declared: rich,
      observed: null,
      leadCtx: {
        city: "Zurich",
        area: null,
        propertyTypeBucket: "condo",
        intentCategory: null,
        leadLocale: null,
      },
      profileConfidence: "high",
      activeLeadCount: 3,
    });
    const low = computeProfileRoutingBonus({
      declared: rich,
      observed: null,
      leadCtx: {
        city: "Zurich",
        area: null,
        propertyTypeBucket: "condo",
        intentCategory: null,
        leadLocale: null,
      },
      profileConfidence: "low",
      activeLeadCount: 3,
    });
    expect(high.delta).toBeGreaterThanOrEqual(low.delta);
    expect(low.delta).toBeLessThanOrEqual(PROFILE_ROUTING_SCORE_DELTA_CAP);
  });

  it("does not exceed fairness cap even with many overlapping signals", () => {
    const declared: BrokerServiceProfileStored = {
      ...emptyStoredProfile(),
      serviceAreas: [
        { city: "Bern", area: "Center", priorityLevel: "primary" },
        { city: "Bern", area: "North", priorityLevel: "secondary" },
      ],
      specializations: [
        { propertyType: "luxury", confidenceSource: "admin_verified", enabled: true },
        { propertyType: "residential", confidenceSource: "self_declared", enabled: true },
      ],
      leadPreferences: [{ leadType: "buyer", priorityLevel: "preferred" }],
      languages: [{ code: "fr", label: "French", proficiency: "fluent" }],
      capacity: { acceptingNewLeads: true, maxActiveLeads: 80 },
    };
    const r = computeProfileRoutingBonus({
      declared,
      observed: {
        brokerId: "x",
        observedServiceAreas: [{ city: "Bern", leadCount: 12 }],
        observedSpecializations: [{ propertyType: "luxury", leadCount: 4 }],
        evidenceCounts: { leadsSampled: 20, windowDays: 90 },
        confidenceNotes: [],
      },
      leadCtx: {
        city: "Bern",
        area: "Center",
        propertyTypeBucket: "luxury",
        intentCategory: "buyer",
        leadLocale: "fr-CH",
      },
      profileConfidence: "high",
      activeLeadCount: 5,
    });
    expect(r.delta).toBeLessThanOrEqual(PROFILE_ROUTING_SCORE_DELTA_CAP);
    expect(r.delta).toBeGreaterThanOrEqual(-PROFILE_ROUTING_SCORE_DELTA_CAP);
  });
});

describe("inferLeadIntentCategory / inferPropertyBucketFromLead", () => {
  it("infers renter from message", () => {
    expect(inferLeadIntentCategory("LEAD", "Looking to rent an apartment")).toBe("renter");
  });

  it("maps property type string to bucket", () => {
    expect(inferPropertyBucketFromLead("Condo near lake")).toBe("condo");
  });
});
