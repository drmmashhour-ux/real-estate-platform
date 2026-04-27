import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { s2Log } from "./s2-logger";

/**
 * S2 — Admin API: allow logged-in platform admin (cookie) **or** `Authorization: Bearer <ADMIN_SECRET>`.
 * Does not break browser admin UI; automation can use Bearer.
 */
export async function s2RequireAdminApiAccess(req: Request): Promise<NextResponse | null> {
  const path = (() => {
    try {
      return new URL(req.url).pathname;
    } catch {
      return "";
    }
  })();

  const user = await getAdminUser();
  if (user) return null;

  const secret = (process.env.ADMIN_SECRET ?? "").trim();
  if (!secret) {
    s2Log("s2_admin_denied", { path, reason: "no_admin_session_and_no_admin_secret" });
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (auth !== `Bearer ${secret}`) {
    s2Log("s2_admin_denied", { path, reason: "bad_bearer" });
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * For mutations that need a real user id. Bearer-only cannot satisfy — caller must be session admin.
 */
export async function s2RequireSessionAdmin(): Promise<ReturnType<typeof getAdminUser> | NextResponse> {
  const u = await getAdminUser();
  if (!u) {
    return NextResponse.json({ ok: false, error: "session_admin_required" }, { status: 403 });
  }
  return u;
}
