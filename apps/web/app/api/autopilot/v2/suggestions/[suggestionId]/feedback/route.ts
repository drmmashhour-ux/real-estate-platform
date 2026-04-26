import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { intelligenceFlags } from "@/config/feature-flags";
import { recordAutopilotV2UserFeedback } from "@/src/modules/autopilot/v2/autopilot.learning";

export const dynamic = "force-dynamic";

/**
 * POST body: { action: "accept" | "reject" } — records bounded learning signal (no auto-apply here).
 */
export async function POST(req: Request, ctx: { params: Promise<{ suggestionId: string }> }) {
  if (!intelligenceFlags.autopilotV2) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { suggestionId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const action = body.action === "accept" || body.action === "reject" ? body.action : null;
  if (!action) {
    return NextResponse.json({ error: "action must be accept or reject" }, { status: 400 });
  }

  const s = await prisma.autopilotV2Suggestion.findUnique({
    where: { id: suggestionId },
    include: { listing: { select: { ownerId: true } } },
  });
  if (!s || s.listing.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (s.status !== "pending") {
    return NextResponse.json({ error: "Suggestion not pending" }, { status: 400 });
  }

  await prisma.autopilotV2Suggestion.update({
    where: { id: s.id },
    data: { status: action === "accept" ? "accepted" : "rejected" },
  });

  await recordAutopilotV2UserFeedback({
    suggestionId: s.id,
    patternKey: s.type,
    accepted: action === "accept",
  });

  return NextResponse.json({ ok: true });
}
