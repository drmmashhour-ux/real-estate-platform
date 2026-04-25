import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { markBnhubManualPayoutPaid } from "@/lib/payouts/manual-bnhub";

export const dynamic = "force-dynamic";

/** POST /api/admin/payouts/mark-manual-paid */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    manualPayoutId?: unknown;
    referenceNote?: unknown;
    beneficiaryName?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const manualPayoutId = typeof body.manualPayoutId === "string" ? body.manualPayoutId.trim() : "";
  if (!manualPayoutId) return NextResponse.json({ error: "manualPayoutId required" }, { status: 400 });

  const row = await prisma.bnhubManualHostPayout.findUnique({
    where: { id: manualPayoutId },
    select: { status: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.status === "paid") return NextResponse.json({ ok: true, duplicate: true });

  await markBnhubManualPayoutPaid({
    manualPayoutId,
    processedByUserId: userId,
    referenceNote: typeof body.referenceNote === "string" ? body.referenceNote : null,
    beneficiaryName: typeof body.beneficiaryName === "string" ? body.beneficiaryName : null,
  });

  return NextResponse.json({ ok: true });
}
