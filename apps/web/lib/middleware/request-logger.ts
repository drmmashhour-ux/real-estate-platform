import type { NextRequest } from "next/server";
import { logInfo } from "@/lib/logging";

/** Propagate across handlers (Edge-safe header name). */
export const REQUEST_ID_HEADER = "x-request-id" as const;

export function ensureRequestId(request: NextRequest): string {
  return request.headers.get(REQUEST_ID_HEADER)?.trim() || crypto.randomUUID();
}

export function headersWithRequestId(request: NextRequest): Headers {
  const h = new Headers(request.headers);
  if (!h.get(REQUEST_ID_HEADER)) {
    h.set(REQUEST_ID_HEADER, crypto.randomUUID());
  }
  return h;
}

export type RequestLogFields = {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  userId?: string | null;
  tenantId?: string | null;
  requestId?: string | null;
};

/**
 * Call from Route Handlers after building a response (logs one JSON line).
 * Does not log request bodies or secrets.
 */
export function logApiRequest(fields: RequestLogFields) {
  logInfo("api_request", {
    requestId: fields.requestId,
    userId: fields.userId,
    tenantId: fields.tenantId,
    action: `${fields.method} ${fields.path}`,
    meta: {
      status: fields.status,
      durationMs: fields.durationMs,
    },
  });
}

export type ApiTimer = {
  requestId: string;
  /** Call after building the response. */
  finish: (res: Response, fields?: { userId?: string | null; tenantId?: string | null }) => void;
};

/** Start timing + resolve request id for structured access logs in route handlers. */
export function createApiTimer(request: NextRequest): ApiTimer {
  const requestId = ensureRequestId(request);
  const start = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;
  return {
    requestId,
    finish(res, fields) {
      logApiRequest({
        method,
        path,
        status: res.status,
        durationMs: Date.now() - start,
        requestId,
        userId: fields?.userId,
        tenantId: fields?.tenantId,
      });
    },
  };
}
