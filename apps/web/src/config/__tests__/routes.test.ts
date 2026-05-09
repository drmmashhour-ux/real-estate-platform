import { describe, expect, it } from "vitest";
import { PLATFORM_ROUTES, getRoutesByHub, getPublicRoutes } from "../routes";

describe("Route Registry", () => {
  it("has no duplicate paths", () => {
    const paths = PLATFORM_ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("every route references a valid hub", () => {
    const validHubs = ["core", "homes", "bnhub", "invest", "forms", "immocontact", "dr-brain", "compliance", "admin", "growth", "design-system"];
    for (const r of PLATFORM_ROUTES) {
      expect(validHubs).toContain(r.hub);
    }
  });

  it("getRoutesByHub returns routes for the hub", () => {
    const bnhubRoutes = getRoutesByHub("bnhub");
    expect(bnhubRoutes.length).toBeGreaterThan(0);
    for (const r of bnhubRoutes) {
      expect(r.hub).toBe("bnhub");
    }
  });

  it("getPublicRoutes returns only public routes", () => {
    const pub = getPublicRoutes();
    for (const r of pub) {
      expect(r.isPublic).toBe(true);
    }
  });
});
