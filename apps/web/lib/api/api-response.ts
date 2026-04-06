/**
 * Standard JSON shapes for App Router handlers — align with `@shared-types` `ApiResponse` where possible.
 * Adopt incrementally; does not replace existing routes in one pass.
 */

import type { ApiResponse } from "@shared-types/index";

export type RouteJsonSuccess<T> = ApiResponse<T> & { success: true };
export type RouteJsonFailure = Extract<ApiResponse<never>, { success: false }> & { code?: string };

export function jsonSuccess<T>(data: T, init?: ResponseInit): Response {
  const body: RouteJsonSuccess<T> = { success: true, data };
  return Response.json(body, { status: 200, ...init });
}

export function jsonFailure(
  error: string,
  status: number = 400,
  code?: string,
  init?: ResponseInit,
): Response {
  const body: RouteJsonFailure = code ? { success: false, error, code } : { success: false, error };
  return Response.json(body, { status, ...init });
}

export function jsonUnauthorized(message = "Unauthorized"): Response {
  return jsonFailure(message, 401, "UNAUTHORIZED");
}

export function jsonForbidden(message = "Forbidden"): Response {
  return jsonFailure(message, 403, "FORBIDDEN");
}
