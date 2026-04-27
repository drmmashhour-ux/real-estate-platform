import { describe, expect, it } from "vitest";
import { ensureDatabaseUrlSslModeRequireForRemote } from "@repo/db/database-url-ssl";

describe("Supabase / Prisma URL stabilization (sslmode=require)", () => {
  it("adds sslmode=require for remote pooler host when missing", () => {
    const u = "postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
    const out = ensureDatabaseUrlSslModeRequireForRemote(u);
    expect(out).toContain("sslmode=require");
    expect(out).toContain("pgbouncer=true");
  });

  it("does not mutate localhost URLs", () => {
    const u = "postgresql://user:password@localhost:5432/real_estate_platform";
    expect(ensureDatabaseUrlSslModeRequireForRemote(u)).toBe(u);
  });

  it("preserves existing sslmode=require", () => {
    const u =
      "postgresql://u:p@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require";
    expect(ensureDatabaseUrlSslModeRequireForRemote(u)).toBe(u);
  });
});
