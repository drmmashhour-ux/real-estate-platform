import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  databaseUrlHasLiteralHostPlaceholder,
  getDatabaseHostHint,
  getDbHostKind,
} from "../database-host-hint";

describe("database-host-hint", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    process.env = { ...saved };
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it("detects literal HOST placeholder in DATABASE_URL", () => {
    expect(databaseUrlHasLiteralHostPlaceholder("postgresql://u:p@HOST:5432/db")).toBe(true);
    expect(databaseUrlHasLiteralHostPlaceholder("postgresql://USER:PASSWORD@HOST:5432/dbname")).toBe(
      true
    );
    expect(databaseUrlHasLiteralHostPlaceholder(undefined)).toBe(false);
    expect(databaseUrlHasLiteralHostPlaceholder("")).toBe(false);
    expect(
      databaseUrlHasLiteralHostPlaceholder(
        "postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
      )
    ).toBe(false);
  });

  it("classifies db host kind", () => {
    expect(getDbHostKind("HOST")).toBe("placeholder");
    expect(getDbHostKind("db.abcdefghijklmnop.pooler.supabase.com")).toBe("supabase");
    expect(getDbHostKind(null)).toBe("unset");
  });

  it("parses hostname from DATABASE_URL", () => {
    process.env.DATABASE_URL =
      "postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
    expect(getDatabaseHostHint()).toBe("aws-0-us-east-1.pooler.supabase.com");
  });
});
