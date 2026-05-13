import { describe, expect, it } from "vitest";
import { allowAnonymousClientShell, isPublicBrowseSurface } from "./public-browse-paths";

describe("public browse surfaces", () => {
  it("keeps staging browse routes anonymous", () => {
    expect(isPublicBrowseSurface("/")).toBe(true);
    expect(isPublicBrowseSurface("/listings")).toBe(true);
    expect(isPublicBrowseSurface("/listings/abc")).toBe(true);
    expect(isPublicBrowseSurface("/bnhub")).toBe(true);
    expect(isPublicBrowseSurface("/bnhub/stays")).toBe(true);
  });

  it("does not make admin or APIs public by prefix accident", () => {
    expect(isPublicBrowseSurface("/admin")).toBe(false);
    expect(isPublicBrowseSurface("/api/listings")).toBe(false);
    expect(isPublicBrowseSurface("/dashboard")).toBe(false);
  });

  it("allows unknown client pathname during hydration to prevent redirect flashes", () => {
    expect(allowAnonymousClientShell(null)).toBe(true);
    expect(allowAnonymousClientShell(undefined)).toBe(true);
    expect(allowAnonymousClientShell("")).toBe(true);
  });
});
