import { NextResponse } from "next/server";
import { logError } from "./logger";
import { crypto } from "crypto";

export interface ApiErrorResponse {
  error: true;
  message: string;
  code: string;
  traceId: string;
}

export function handleApiError(error: any, context?: string): NextResponse<ApiErrorResponse> {
  const traceId = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  const tag = "api";
  const message = error instanceof Error ? error.message : "Internal Server Error";
  
  // Normalize code based on common error patterns
  let code = "INTERNAL_ERROR";
  let status = 500;

  if (error.name === "ZodError" || error.code === "VALIDATION_ERROR") {
    code = "VALIDATION_FAILED";
    status = 400;
  } else if (error.status === 401 || error.name === "AuthError") {
    code = "UNAUTHORIZED";
    status = 401;
  } else if (error.status === 403) {
    code = "FORBIDDEN";
    status = 403;
  } else if (error.status === 404) {
    code = "NOT_FOUND";
    status = 404;
  } else if (error.status === 429) {
    code = "RATE_LIMITED";
    status = 429;
  }

  // Log normalized error
  logError(tag, `API Error in ${context || "unknown"}: ${message}`, error, traceId);

  return NextResponse.json(
    {
      error: true,
      message: status === 500 ? "An unexpected error occurred. Please contact support." : message,
      code,
      traceId,
    },
    { status }
  );
}

export function createErrorResponse(message: string, code: string, status: number = 400): NextResponse<ApiErrorResponse> {
  const traceId = Math.random().toString(36).slice(2);
  return NextResponse.json(
    {
      error: true,
      message,
      code,
      traceId,
    },
    { status }
  );
}
