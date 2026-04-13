import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";

/**
 * Cookie-session guard for App Router API routes (same contract as `getGuestId` / DB-backed session).
 * Use for routes not already covered by `middleware.ts` session gates.
 */
export type ApiSessionResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

export async function requireApiSession(): Promise<ApiSessionResult> {
  const userId = await getGuestId();
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sign in required" }, { status: 401 }),
    };
  }
  return { ok: true, userId };
}
