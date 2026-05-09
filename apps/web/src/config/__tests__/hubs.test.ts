import { describe, expect, it } from "vitest";
import { PLATFORM_HUBS, getHub, getPublicHubs, getHubBySlug } from "../hubs";

describe("Hub Registry", () => {
  it("exports all 9 required hubs", () => {
    const ids = PLATFORM_HUBS.map((h) => h.id);
    expect(ids).toContain("core");
    expect(ids).toContain("homes");
    expect(ids).toContain("bnhub");
    expect(ids).toContain("invest");
    expect(ids).toContain("forms");
    expect(ids).toContain("immocontact");
    expect(ids).toContain("dr-brain");
    expect(ids).toContain("compliance");
    expect(ids).toContain("design-system");
    expect(PLATFORM_HUBS.length).toBe(9);
  });

  it("has no duplicate hub ids", () => {
    const ids = PLATFORM_HUBS.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate slugs", () => {
    const slugs = PLATFORM_HUBS.map((h) => h.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("getHub returns correct hub", () => {
    expect(getHub("bnhub")?.name).toBe("BNHub");
    expect(getHub("core")?.status).toBe("active");
  });

  it("getPublicHubs returns only public active/beta hubs", () => {
    const pub = getPublicHubs();
    for (const h of pub) {
      expect(h.audience).toBe("public");
      expect(["active", "beta"]).toContain(h.status);
    }
  });

  it("getHubBySlug resolves correctly", () => {
    expect(getHubBySlug("bnhub")?.id).toBe("bnhub");
    expect(getHubBySlug("homes")?.id).toBe("homes");
    expect(getHubBySlug("nonexistent")).toBeUndefined();
  });
});
