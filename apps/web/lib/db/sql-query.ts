/**
 * Order 81.1 — typed `pg` queries on the shared pool (resilience via {@link @/lib/db/db-safe queryWithRetry}).
 * Prefer `import { query, readOnlyQuery } from "@/lib/db"`.
 */
import "server-only";

import type { QueryResultRow } from "pg";

import { queryWithRetry } from "@/lib/db/db-safe";

import {
  classifySqlStatementKind,
  extractLeadingSqlCommentTag,
  ReadOnlyQueryError,
} from "./sql-query-guard";

export { classifySqlStatementKind, extractLeadingSqlCommentTag, ReadOnlyQueryError } from "./sql-query-guard";

function logSlow(duration: number, text: string): void {
  if (duration <= 300) return;
  const tag = extractLeadingSqlCommentTag(text);
  console.warn("[SLOW QUERY]", {
    duration,
    tag,
    textPreview: text.length > 800 ? `${text.slice(0, 800)}…` : text,
  });
}

/**
 * Parameterized query; returns rows only. Uses retry + circuit from `@/lib/db/db-safe`.
 * Add a leading SQL block comment for observability (first line), e.g. search:listings before SELECT.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now();
  try {
    if (process.env.DB_SQL_LOG !== "0") {
      console.log("[SQL]", text, params);
    }
    const res = await queryWithRetry(text, params, 2);
    return res.rows as T[];
  } catch (e) {
    console.error("[SQL ERROR]", e);
    throw e;
  } finally {
    logSlow(Date.now() - start, text);
  }
}

/** Like {@link query} but throws if the statement is not a read (SELECT / WITH / EXPLAIN / …). */
export async function readOnlyQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const kind = classifySqlStatementKind(text);
  if (kind !== "read") {
    throw new ReadOnlyQueryError(
      kind === "write"
        ? "readOnlyQuery: mutating SQL is not allowed"
        : "readOnlyQuery: could not classify SQL as a read; use query() for non-SELECT paths"
    );
  }
  return query<T>(text, params);
}
