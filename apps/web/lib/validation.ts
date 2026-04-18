import type { ZodSchema } from "zod";

import { jsonFailure } from "@/lib/api-response";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response };

/**
 * Parse body with Zod; return a ready JSON failure response on error (400).
 */
export function parseBody<T>(schema: ZodSchema<T>, body: unknown): ParseResult<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join("; ") || "Invalid request body";
    return { ok: false, response: jsonFailure(msg, 400, "VALIDATION_ERROR") };
  }
  return { ok: true, data: result.data };
}
