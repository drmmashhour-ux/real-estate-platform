import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** POST /api/admin/payouts/retry — reset a failed orchestrated payout to scheduled (admin only). */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { orchestratedPayoutId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = typeof body.orchestratedPayoutId === "string" ? body.orchestratedPayoutId.trim() : "";
  if (!id) return NextResponse.json({ error: "orchestratedPayoutId required" }, { status: 400 });

  const updated = await prisma.orchestratedPayout.updateMany({
    where: { id, status: "failed", payoutMethod: { not: "manual" } },
    data: {
      status: "scheduled",
      failureReason: null,
      providerRef: null,
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "No failed Stripe payout updated (wrong id or not failed)" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
