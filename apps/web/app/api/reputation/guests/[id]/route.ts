import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { reputationEngineFlags } from "@/config/feature-flags";
import { buildGuestTrustSnapshot } from "@/modules/trust-scores/guest-trust-score.service";
import { schedulePersistGuestTrustSnapshot } from "@/modules/reputation/snapshot-writer.service";

export const dynamic = "force-dynamic";

/** Admin-only — guest trust can influence payouts / risk reviews. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  if (!reputationEngineFlags.reputationEngineV1) {
    return NextResponse.json({ error: "Reputation engine disabled" }, { status: 403 });
  }

  const { id: guestUserId } = await ctx.params;
  if (!guestUserId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const trust = await buildGuestTrustSnapshot(guestUserId);
    schedulePersistGuestTrustSnapshot(guestUserId, trust);
    return NextResponse.json({ guestUserId, trust });
  } catch (e) {
    console.error("[api/reputation/guests] snapshot failed", e);
    return NextResponse.json({ error: "Unable to load guest reputation" }, { status: 503 });
  }
}
