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
        "postgresql://u:p@ep-abc-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
      )
    ).toBe(false);
  });

  it("classifies db host kind", () => {
    expect(getDbHostKind("HOST")).toBe("placeholder");
    expect(getDbHostKind("ep-1.us-east-2.aws.neon.tech")).toBe("neon");
    expect(getDbHostKind(null)).toBe("unset");
  });

  it("parses hostname from DATABASE_URL", () => {
    process.env.DATABASE_URL =
      "postgresql://u:p@ep-xyz-pooler.us-east-2.aws.neon.tech/db?sslmode=require";
    expect(getDatabaseHostHint()).toBe("ep-xyz-pooler.us-east-2.aws.neon.tech");
  });
});
