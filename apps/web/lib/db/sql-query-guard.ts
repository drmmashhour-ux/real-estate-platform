/**
 * Pure SQL classification (no pool / Prisma) — safe to import in unit tests.
 */

export class ReadOnlyQueryError extends Error {
  override name = "ReadOnlyQueryError";
  constructor(message = "readOnlyQuery rejected a mutating SQL statement") {
    super(message);
  }
}

/** Extracts the first leading block-comment tag (for logs), e.g. search:listings inside the comment. */
export function extractLeadingSqlCommentTag(text: string): string | undefined {
  const m = text.match(/^\s*\/\*\s*([^*]+?)\s*\*\//);
  return m?.[1]?.trim();
}

function stripLeadingBlockComments(text: string): string {
  return text.replace(/^\s*(?:\/\*[\s\S]*?\*\/\s*)+/g, "").trim();
}

/**
 * Heuristic read vs write after leading block-comment tags (Order 81.1 guard for read paths).
 */
export function classifySqlStatementKind(text: string): "read" | "write" | "unknown" {
  let s = stripLeadingBlockComments(text);
  if (!s) return "unknown";
  if (s.startsWith("(") && /^\(\s*SELECT\b/i.test(s)) {
    return "read";
  }
  const u = s.toUpperCase();
  if (/^(SELECT|WITH|EXPLAIN|SHOW|VALUES)\b/.test(u)) return "read";
  if (/^(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|DROP|CREATE|GRANT|REVOKE)\b/.test(u)) return "write";
  return "unknown";
}
