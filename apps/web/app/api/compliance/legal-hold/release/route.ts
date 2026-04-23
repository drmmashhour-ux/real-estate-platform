import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/get-session";
import { assertComplianceOwnerAccess } from "@/lib/compliance/compliance-access";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const holdId = typeof body.holdId === "string" ? body.holdId.trim() : "";

  if (!holdId) {
    return NextResponse.json({ success: false, error: "HOLD_ID_REQUIRED" }, { status: 400 });
  }

  const existing = await prisma.legalHold.findUnique({ where: { id: holdId } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const access = await assertComplianceOwnerAccess(user, existing.ownerType, existing.ownerId);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.message }, { status: 403 });
  }

  const hold = await prisma.legalHold.update({
    where: { id: holdId },
    data: {
      active: false,
      releasedAt: new Date(),
    },
  });

  if (existing.entityType && existing.entityId) {
    await prisma.recordRetention.updateMany({
      where: {
        entityType: existing.entityType,
        entityId: existing.entityId,
      },
      data: {
        legalHoldActive: false,
        legalHoldReason: null,
      },
    });
  }

  await logAuditEvent({
    ownerType: hold.ownerType,
    ownerId: hold.ownerId,
    entityType: "legal_hold",
    entityId: hold.id,
    actionType: "legal_hold_released",
    moduleKey: "general",
    actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: user.id,
    severity: "info",
    summary: "Legal hold released",
    details: {
      entityType: hold.entityType,
      entityId: hold.entityId,
    },
  });

  return NextResponse.json({ success: true, hold });
}
