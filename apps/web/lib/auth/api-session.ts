import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, parseSessionUserId } from "@/lib/auth/session-cookie";

/**
 * Read authenticated user id from a Route Handler request (same cookie as pages).
 * Middleware already blocks unauthenticated access to `/api/dashboard/*`; use this when a handler needs `userId`.
 */
export function getSessionUserIdFromRequest(request: NextRequest): string | null {
  return parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
}

/** Returns 401 if no session cookie (defense in depth if proxy is bypassed). */
export function requireSessionUserIdOr401(request: NextRequest): { userId: string } | NextResponse {
  const userId = getSessionUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId };
}
