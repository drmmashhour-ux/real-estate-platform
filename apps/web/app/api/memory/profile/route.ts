import { NextResponse } from "next/server";
import { intelligenceFlags } from "@/config/feature-flags";
import { requireUser } from "@/lib/auth/require-user";
import { getUserMemoryProfile } from "@/lib/marketplace-memory/memory-query.service";

export const dynamic = "force-dynamic";

/** GET /api/memory/profile — current user memory profile (Law 25–aligned; audited read). */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (!intelligenceFlags.marketplaceMemoryEngineV1) {
    return NextResponse.json({ ok: true, disabled: true, profile: null });
  }

  const profile = await getUserMemoryProfile(auth.user.id, {
    auditRead: true,
    actorId: auth.user.id,
  });

  return NextResponse.json({ ok: true, profile });
}
