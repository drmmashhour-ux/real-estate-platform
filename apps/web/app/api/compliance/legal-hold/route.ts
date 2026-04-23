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
  const ownerType = typeof body.ownerType === "string" ? body.ownerType.trim() : "";
  const ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";
  const holdType = typeof body.holdType === "string" ? body.holdType.trim() : "";
  const entityType = typeof body.entityType === "string" ? body.entityType.trim() : "";
  const entityId = typeof body.entityId === "string" ? body.entityId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const appliesGlobally = body.appliesGlobally === true;
  const actorId = typeof body.actorId === "string" && body.actorId.trim() ? body.actorId.trim() : user.id;

  if (user.role === PlatformRole.BROKER && actorId !== user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (!ownerType || !ownerId || !holdType || !reason) {
    return NextResponse.json({ success: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  if (!appliesGlobally && (!entityType || !entityId)) {
    return NextResponse.json(
      { success: false, error: "ENTITY_REQUIRED_WHEN_NOT_GLOBAL" },
      { status: 400 },
    );
  }

  const access = await assertComplianceOwnerAccess(user, ownerType, ownerId);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.message }, { status: 403 });
  }

  const hold = await prisma.legalHold.create({
    data: {
      ownerType,
      ownerId,
      holdType,
      entityType: appliesGlobally ? null : entityType,
      entityId: appliesGlobally ? null : entityId,
      appliesGlobally,
      reason,
      imposedByActorId: actorId,
    },
  });

  if (!appliesGlobally && entityId) {
    await prisma.recordRetention.upsert({
      where: {
        entityType_entityId: { entityType, entityId },
      },
      create: {
        ownerType,
        ownerId,
        entityType,
        entityId,
        legalHoldActive: true,
        legalHoldReason: reason,
        immutable: true,
      },
      update: {
        legalHoldActive: true,
        legalHoldReason: reason,
        immutable: true,
      },
    });
  }

  await logAuditEvent({
    ownerType,
    ownerId,
    entityType: "legal_hold",
    entityId: hold.id,
    actionType: "legal_hold_created",
    moduleKey: "general",
    actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId,
    severity: "high",
    summary: "Legal hold imposed",
    details: {
      holdType,
      appliesGlobally,
      entityType: hold.entityType,
      entityId: hold.entityId,
    },
  });

  return NextResponse.json({ success: true, hold });
}
