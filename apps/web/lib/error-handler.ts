import { jsonFailure } from "@/lib/api-response";
import { logError } from "@/lib/logger";

/**
 * Maps unknown errors to a safe JSON response. Never exposes stack traces or internal details for 5xx.
 */
export function routeErrorResponse(
  err: unknown,
  options?: {
    /** Shown to the client on 5xx (default: generic). */
    publicMessage?: string;
    status?: number;
    code?: string;
    /** Set false to skip logging (e.g. already logged). */
    log?: boolean;
  },
): Response {
  const status = options?.status ?? 500;
  if (options?.log !== false) {
    logError("route_error", err);
  }
  if (status >= 500) {
    return jsonFailure(
      options?.publicMessage ?? "Internal server error",
      status,
      options?.code ?? "INTERNAL_ERROR",
    );
  }
  const message =
    err instanceof Error ? err.message : (options?.publicMessage ?? "Request failed");
  return jsonFailure(message, status, options?.code);
}
