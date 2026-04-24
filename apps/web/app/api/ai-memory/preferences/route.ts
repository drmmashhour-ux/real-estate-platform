import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { upsertUserPreference } from "@/modules/ai-memory/user-preferences";

const ALLOWED_KEYS = new Set([
  "ui_locale",
  "language",
  "draft_detail_level",
  "clause_strictness",
]);

export const dynamic = "force-dynamic";

/**
 * POST /api/ai-memory/preferences — user may only set own preferences (draft personalization).
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: { userId?: string; preferenceKey?: string; value?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const preferenceKey = typeof body.preferenceKey === "string" ? body.preferenceKey.trim() : "";
  const value = typeof body.value === "string" ? body.value : "";

  if (!userId || !preferenceKey || !value.trim()) {
    return NextResponse.json({ error: "userId, preferenceKey, value required" }, { status: 400 });
  }
  if (userId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!ALLOWED_KEYS.has(preferenceKey)) {
    return NextResponse.json({ error: "preferenceKey not allowed" }, { status: 400 });
  }

  await upsertUserPreference(userId, preferenceKey, value.trim());
  return NextResponse.json({ ok: true });
}
