import { describe, expect, it } from "vitest";

import {
  classifySqlStatementKind,
  extractLeadingSqlCommentTag,
  ReadOnlyQueryError,
} from "../sql-query-guard";

describe("extractLeadingSqlCommentTag", () => {
  it("returns the first block comment tag", () => {
    expect(extractLeadingSqlCommentTag(`  /* search:listings */ SELECT 1`)).toBe("search:listings");
  });
});

describe("classifySqlStatementKind", () => {
  it("treats tagged SELECT as read", () => {
    expect(classifySqlStatementKind("/* t */ SELECT 1")).toBe("read");
  });
  it("treats INSERT as write", () => {
    expect(classifySqlStatementKind("INSERT INTO x VALUES (1)")).toBe("write");
  });
  it("treats DELETE as write", () => {
    expect(classifySqlStatementKind('DELETE FROM "User" WHERE false')).toBe("write");
  });
});

describe("ReadOnlyQueryError", () => {
  it("is throw new for mutating classification", () => {
    expect(classifySqlStatementKind("UPDATE x SET y=1")).toBe("write");
    expect(new ReadOnlyQueryError().name).toBe("ReadOnlyQueryError");
  });
});
