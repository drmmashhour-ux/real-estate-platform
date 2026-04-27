import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { sybnbCheck5PerMin } from "@/lib/sybnb/sybnb-rate-5per-min";

/** SYBNB-7: consistent client JSON for validation / client errors. */
export function sybnbFail(error: string, status = 400, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ success: false, error }, { status, headers });
}

export function sybnbJson(data: object, status = 200, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status, headers });
}

export function firstZodIssueMessage(err: ZodError): string {
  return err.issues[0]?.message?.trim() || "Invalid input";
}

/**
 * 5 req/min per IP (SYBNB-7) — booking creation, report API.
 * Returns 429 with Retry-After when over limit.
 */
export function assertSybnb5PerMin(
  kind: "booking_create" | "listing_report",
  ip: string,
): NextResponse | null {
  const r = sybnbCheck5PerMin(`sybnb:${kind}:${ip}`);
  if (r.ok) {
    return null;
  }
  return sybnbFail("Too many requests. Try again in a moment.", 429, {
    "Retry-After": String(r.retryAfterSec),
  });
}
