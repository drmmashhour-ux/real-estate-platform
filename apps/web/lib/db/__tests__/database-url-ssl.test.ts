import { describe, expect, it } from "vitest";
import {
  databaseUrlDeclaresSsl,
  getDatabaseSslWarningForProduction,
  isLocalDatabaseHost,
} from "@/lib/db/database-url-ssl";

describe("database-url-ssl", () => {
  it("treats localhost as local", () => {
    expect(isLocalDatabaseHost("localhost")).toBe(true);
    expect(isLocalDatabaseHost("127.0.0.1")).toBe(true);
  });

  it("detects sslmode=require on remote host", () => {
    const u = new URL("postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require");
    expect(databaseUrlDeclaresSsl(u)).toBe(true);
    expect(getDatabaseSslWarningForProduction(u.toString())).toBeNull();
  });

  it("warns when remote URL omits ssl params", () => {
    const raw = "postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
    const w = getDatabaseSslWarningForProduction(raw);
    expect(w).toBeTruthy();
    expect(w).toContain("sslmode");
  });

  it("does not warn for local URL without sslmode", () => {
    expect(getDatabaseSslWarningForProduction("postgresql://u:p@localhost:5432/app")).toBeNull();
  });
});
