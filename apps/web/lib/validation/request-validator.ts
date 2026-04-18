/**
 * API input validation — prefer Zod `.strict()` or `.strip()` to reject unexpected fields.
 * @see parseBody in `@/lib/validation` for JSON bodies
 */
import type { ZodSchema } from "zod";

import { jsonFailure } from "@/lib/api-response";

import { parseBody, type ParseResult } from "@/lib/validation";

export { parseBody, type ParseResult };

export type QueryParseResult<T> = { ok: true; data: T } | { ok: false; response: Response };

/**
 * Validate URLSearchParams (e.g. `req.nextUrl.searchParams`) with a Zod object schema.
 */
export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>,
): QueryParseResult<T> {
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  const result = schema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join("; ") || "Invalid query";
    return { ok: false, response: jsonFailure(msg, 400, "VALIDATION_ERROR") };
  }
  return { ok: true, data: result.data };
}

/**
 * Safe JSON parse for Route Handlers — returns Response on parse failure (400), not throw.
 */
export async function parseJsonBodyUnknown(req: Request): Promise<unknown | Response> {
  try {
    const text = await req.text();
    if (!text.trim()) return {};
    return JSON.parse(text) as unknown;
  } catch {
    return jsonFailure("Invalid JSON body", 400, "INVALID_JSON");
  }
}

/**
 * JSON body + Zod schema in one step.
 */
export async function parseJsonBody<T>(req: Request, schema: ZodSchema<T>): Promise<ParseResult<T> | Response> {
  const raw = await parseJsonBodyUnknown(req);
  if (raw instanceof Response) return raw;
  return parseBody(schema, raw);
}
