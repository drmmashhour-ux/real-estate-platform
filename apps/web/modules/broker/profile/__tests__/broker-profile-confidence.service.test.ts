import { describe, expect, it } from "vitest";
import { buildProfileConfidenceAndMergeNotes } from "../broker-profile-confidence.service";
import { emptyStoredProfile } from "../broker-profile-payload";

describe("buildProfileConfidenceAndMergeNotes", () => {
  it("marks sparse profiles as low confidence with fallback note", () => {
    const r = buildProfileConfidenceAndMergeNotes(emptyStoredProfile());
    expect(r.profileConfidence).toBe("low");
    expect(r.explanationNotes.some((n) => n.toLowerCase().includes("sparse"))).toBe(true);
  });

  it("raises confidence when several dimensions are declared", () => {
    const stored = {
      ...emptyStoredProfile(),
      serviceAreas: [
        { city: "A", priorityLevel: "primary" as const, area: null },
        { city: "B", priorityLevel: "secondary" as const, area: null },
        { city: "C", priorityLevel: "occasional" as const, area: null },
      ],
      specializations: [{ propertyType: "residential" as const, confidenceSource: "self_declared" as const, enabled: true }],
      leadPreferences: [{ leadType: "buyer" as const, priorityLevel: "standard" as const }],
      languages: [{ code: "de", label: "German", proficiency: "fluent" as const }],
      capacity: { acceptingNewLeads: true, maxActiveLeads: 25 },
      adminVerifiedAt: new Date().toISOString(),
    };
    const r = buildProfileConfidenceAndMergeNotes(stored);
    expect(["medium", "high"]).toContain(r.profileConfidence);
  });
});
