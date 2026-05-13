import { describe, expect, it } from "vitest";
import { normalizeDatabaseUrlForPrisma } from "./normalize-database-url";

describe("normalizeDatabaseUrlForPrisma", () => {
  it("returns undefined for empty database URLs", () => {
    expect(normalizeDatabaseUrlForPrisma(undefined)).toBeUndefined();
    expect(normalizeDatabaseUrlForPrisma("   ")).toBeUndefined();
  });

  it("strips Neon channel_binding while preserving other params", () => {
    expect(
      normalizeDatabaseUrlForPrisma(
        "postgresql://user:pass@example.neon.tech/db?sslmode=require&channel_binding=require"
      )
    ).toBe("postgresql://user:pass@example.neon.tech/db?sslmode=require");
  });

  it("leaves non-placeholder database URLs unchanged", () => {
    const url = "postgresql://user:pass@example.com/db?sslmode=require";

    expect(normalizeDatabaseUrlForPrisma(url)).toBe(url);
  });
});
