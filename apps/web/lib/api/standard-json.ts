import { NextResponse } from "next/server";

/** Standard JSON envelope for launch-hardened API routes. */
export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: string; code?: string };

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status: 200, ...init });
}

export function jsonErr(message: string, status = 400, code?: string): NextResponse<ApiFailure> {
  const body: ApiFailure = code ? { success: false, error: message, code } : { success: false, error: message };
  return NextResponse.json(body, { status });
}
