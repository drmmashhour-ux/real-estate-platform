import { NextResponse } from "next/server";
import { intelligenceFlags } from "@/config/feature-flags";
import { requireUser } from "@/lib/auth/require-user";
import { exportUserMemoryJson } from "@/lib/marketplace-memory/memory-query.service";

export const dynamic = "force-dynamic";

/** GET /api/memory/export — portable JSON export (right of access). */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (!intelligenceFlags.marketplaceMemoryEngineV1) {
    return NextResponse.json({
      ok: true,
      disabled: true,
      exportedAt: new Date().toISOString(),
      userId: auth.user.id,
      profile: null,
      events: [],
      insights: [],
      sessions: [],
    });
  }

  const bundle = await exportUserMemoryJson(auth.user.id, auth.user.id);
  return NextResponse.json({ ok: true, ...bundle });
}
