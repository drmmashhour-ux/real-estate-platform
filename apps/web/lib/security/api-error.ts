import { NextResponse } from "next/server";
import { REQUEST_ID_HEADER } from "@/lib/middleware/request-logger";

export function isProductionLike(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

/**
 * JSON error for API routes: never leak stack traces or internal paths in production.
 */
export function safeApiError(
  status: number,
  publicMessage: string,
  options?: {
    code?: string;
    requestId?: string | null;
    /** Logged server-side only */
    cause?: unknown;
  }
): NextResponse {
  if (options?.cause !== undefined && isProductionLike()) {
    console.error("[api-error]", publicMessage, options.code ?? status, options.cause);
  } else if (options?.cause !== undefined) {
    console.error("[api-error]", publicMessage, options.code ?? status, options.cause);
  }

  const body: Record<string, string> = { error: publicMessage };
  if (options?.code) body.code = options.code;

  const res = NextResponse.json(body, { status });
  if (options?.requestId) {
    res.headers.set(REQUEST_ID_HEADER, options.requestId);
  }
  return res;
}

/** Map unknown thrown values to a safe client message in production. */
export function toSafeErrorMessage(err: unknown, fallback = "Request failed"): string {
  if (!isProductionLike() && err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}
