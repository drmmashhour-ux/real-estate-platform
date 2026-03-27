import { NextResponse } from "next/server";
import { logError } from "@/lib/logging";
import { trackError } from "@/lib/metrics";

export type SafeErrorOptions = {
  requestId?: string | null;
  /** Logged server-side only */
  context?: string;
};

/**
 * Return a safe JSON error for API routes. Never exposes stack traces in production.
 */
export function safeApiError(
  err: unknown,
  status = 500,
  opts?: SafeErrorOptions
): NextResponse {
  const isProd = process.env.NODE_ENV === "production";
  const message = err instanceof Error ? err.message : "Internal error";
  logError(opts?.context ?? "api_error", {
    requestId: opts?.requestId,
    err,
  });
  trackError(opts?.context ?? "api", { status });
  return NextResponse.json(
    {
      error: isProd ? "Internal server error" : message,
      ...(opts?.requestId ? { requestId: opts.requestId } : {}),
    },
    { status }
  );
}
