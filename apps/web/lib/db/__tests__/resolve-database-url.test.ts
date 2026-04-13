import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { resolveDatabaseUrlIntoEnv } from "../resolve-database-url";

describe("resolveDatabaseUrlIntoEnv", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    process.env = { ...saved };
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it("does not override a valid DATABASE_URL", () => {
    process.env.DATABASE_URL =
      "postgresql://u:p@ep-real.neon.tech:5432/db?sslmode=require";
    delete process.env.POSTGRES_PRISMA_URL;
    delete process.env.POSTGRES_URL;
    resolveDatabaseUrlIntoEnv();
    expect(process.env.DATABASE_URL).toContain("ep-real.neon.tech");
  });

  it("fills DATABASE_URL from POSTGRES_PRISMA_URL when DATABASE_URL is a HOST template", () => {
    process.env.DATABASE_URL = "postgresql://u:p@HOST:5432/db";
    process.env.POSTGRES_PRISMA_URL =
      "postgresql://v:secret@db.vercel-storage.com:5432/v?sslmode=require";
    resolveDatabaseUrlIntoEnv();
    expect(process.env.DATABASE_URL).toBe(process.env.POSTGRES_PRISMA_URL);
  });

  it("fills DATABASE_URL from POSTGRES_URL when DATABASE_URL is unset", () => {
    delete process.env.DATABASE_URL;
    process.env.POSTGRES_URL = "postgresql://v:secret@pool.example:5432/db";
    resolveDatabaseUrlIntoEnv();
    expect(process.env.DATABASE_URL).toBe(process.env.POSTGRES_URL);
  });
});
