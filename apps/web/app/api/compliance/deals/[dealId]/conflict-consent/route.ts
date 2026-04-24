import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import {
  conflictDisclosureEnforced,
  recordDealConflictClientConsent,
} from "@/lib/compliance/conflict-deal-compliance.service";
import { CONFLICT_DISCLOSURE_ACK_TEXT } from "@/lib/compliance/conflict-deal-compliance.constants";

export const dynamic = "force-dynamic";

function clientIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || null;
}

/**
 * POST — record client acknowledgment for broker conflict-of-interest disclosure (`[compliance:conflict]` audit).
 */
export async function POST(req: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  if (!conflictDisclosureEnforced()) {
    return NextResponse.json({ error: "Conflict disclosure enforcement disabled" }, { status: 403 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!dealId) return NextResponse.json({ error: "dealId required" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { acknowledgmentText?: unknown };
  const acknowledgmentText =
    typeof body.acknowledgmentText === "string" ? body.acknowledgmentText.trim() : "";

  if (acknowledgmentText !== CONFLICT_DISCLOSURE_ACK_TEXT) {
    return NextResponse.json({ error: "Acknowledgment text must match the required disclosure wording." }, { status: 400 });
  }

  const party = await prisma.deal.findFirst({
    where: { id: dealId, OR: [{ buyerId: userId }, { sellerId: userId }] },
    select: { id: true },
  });
  if (!party) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const h = await headers();
  try {
    await recordDealConflictClientConsent({
      dealId,
      userId,
      acknowledgmentText,
      clientIp: clientIp(h),
      userAgent: h.get("user-agent")?.slice(0, 512) ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status = msg === "Not a consenting party for this deal." ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ ok: true });
}
