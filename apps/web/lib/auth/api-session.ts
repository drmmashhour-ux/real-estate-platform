import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { resolveSessionTokenToUserId } from "@/lib/auth/db-session";

/**
 * Read authenticated user id from a Route Handler request (opaque session token in cookie → DB).
 */
export async function getSessionUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const raw = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  return resolveSessionTokenToUserId(raw);
}

/** Returns 401 if no valid session (revoked / expired / missing). */
export async function requireSessionUserIdOr401(
  request: NextRequest,
): Promise<{ userId: string } | NextResponse> {
  const userId = await getSessionUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId };
}
