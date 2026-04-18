import { NextResponse } from "next/server";
import type { SessionUser } from "@/lib/auth/get-session";
import { getSession } from "@/lib/auth/get-session";

export type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

/**
 * Requires a logged-in user (any platform role). Returns 401 JSON if missing.
 */
export async function requireUser(): Promise<AuthResult> {
  const { user } = await getSession();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }
  return { ok: true, user };
}
