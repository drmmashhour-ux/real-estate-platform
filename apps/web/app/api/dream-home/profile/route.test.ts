import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/modules/dream-home/services/dream-home-profile.service", () => ({
  buildDreamHomeProfile: vi.fn().mockResolvedValue({
    profile: {
      householdProfile: "H",
      propertyTraits: ["p"],
      neighborhoodTraits: ["n"],
      searchFilters: {},
      rationale: ["r"],
    },
    source: "deterministic" as const,
  }),
}));

describe("POST /api/dream-home/profile", () => {
  it("returns ok and profile", async () => {
    const res = await POST(
      new Request("http://localhost/api/dream-home/profile", {
        method: "POST",
        body: JSON.stringify({ familySize: 2, city: "montreal" }),
      }),
    );
    const j = (await res.json()) as { ok: boolean; source: string };
    expect(res.status).toBe(200);
    expect(j.ok).toBe(true);
    expect(j.source).toBe("deterministic");
  });
});
