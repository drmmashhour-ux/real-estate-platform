/**
 * LECIPM Production Infrastructure v1 — compose validation + auth for Route Handlers.
 * Prefer this pattern on critical POST/PUT routes (after Zod body parse).
 */
import type { ZodSchema } from "zod";
import { routeErrorResponse } from "@/lib/error-handler";
import type { AuthResult } from "@/lib/auth/require-user";
import type { AppRouteRole } from "@/lib/auth/require-role";
import { requireRole } from "@/lib/auth/require-role";
import { requireUser } from "@/lib/auth/require-user";
import { parseJsonBody } from "@/lib/validation/request-validator";

export async function guardJsonBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const parsed = await parseJsonBody(req, schema);
  if (parsed instanceof Response) return { ok: false, response: parsed };
  if (!parsed.ok) return { ok: false, response: parsed.response };
  return { ok: true, data: parsed.data };
}

export async function requireAuthRole(role: AppRouteRole): Promise<AuthResult> {
  return requireRole(role);
}

export async function requireAuthUser(): Promise<AuthResult> {
  return requireUser();
}

/**
 * Run handler; map thrown errors to safe JSON (no stack leak on 5xx).
 */
export async function runGuarded(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    return routeErrorResponse(err);
  }
}
