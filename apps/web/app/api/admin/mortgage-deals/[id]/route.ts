import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const id = await getGuestId();
  if (!id) return { ok: false as const, status: 401, error: "Sign in required" };
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") return { ok: false as const, status: 403, error: "Admin only" };
  return { ok: true as const };
}

/**
 * PATCH — admin verifies / adjusts commission split (must still sum to dealAmount).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const deal = await prisma.mortgageDeal.findUnique({
    where: { id },
    select: { id: true, dealAmount: true, platformShare: true, expertShare: true, status: true },
  });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const platformShareRaw =
    body.platformShare != null ? Math.round(Number(body.platformShare)) : undefined;
  const expertShareRaw = body.expertShare != null ? Math.round(Number(body.expertShare)) : undefined;
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 8000) : undefined;
  const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : undefined;

  const nextPlatform = platformShareRaw ?? deal.platformShare;
  const nextExpert = expertShareRaw ?? deal.expertShare;

  if (platformShareRaw != null || expertShareRaw != null) {
    if (nextPlatform + nextExpert !== deal.dealAmount) {
      return NextResponse.json(
        { error: `Platform + expert shares must equal deal amount (${deal.dealAmount})` },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.mortgageDeal.update({
    where: { id },
    data: {
      ...(platformShareRaw != null ? { platformShare: nextPlatform } : {}),
      ...(expertShareRaw != null ? { expertShare: nextExpert } : {}),
      ...(adminNote !== undefined ? { adminNote: adminNote || null } : {}),
      ...(status && ["closed", "adjusted", "void"].includes(status) ? { status } : {}),
    },
  });

  if (status === "adjusted" || platformShareRaw != null || expertShareRaw != null) {
    await prisma.lead
      .updateMany({
        where: { id: updated.leadId },
        data: {
          finalCommission: updated.platformShare,
          commissionEstimate: updated.platformShare,
        },
      })
      .catch(() => {});
  }

  return NextResponse.json({ ok: true, deal: updated });
}
