import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { assertComplianceOwnerAccess } from "@/lib/compliance/compliance-access";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER && auth.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  let ownerType = typeof body.ownerType === "string" ? body.ownerType.trim() : "";
  let ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";

  if (!ownerType || !ownerId) {
    if (auth.user.role === PlatformRole.ADMIN) {
      return NextResponse.json({ success: false, error: "OWNER_REQUIRED" }, { status: 400 });
    }
    ownerType = "solo_broker";
    ownerId = auth.user.id;
  }

  const access = await assertComplianceOwnerAccess(auth.user, ownerType, ownerId);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.message }, { status: 403 });
  }

  const where: Prisma.ComplianceAuditRecordWhereInput = {
    ownerType,
    ownerId,
  };

  if (typeof body.entityType === "string" && body.entityType.trim()) {
    where.entityType = body.entityType.trim();
  }
  if (typeof body.entityId === "string" && body.entityId.trim()) {
    where.entityId = body.entityId.trim();
  }
  if (typeof body.moduleKey === "string" && body.moduleKey.trim()) {
    where.moduleKey = body.moduleKey.trim();
  }
  if (typeof body.linkedListingId === "string" && body.linkedListingId.trim()) {
    where.linkedListingId = body.linkedListingId.trim();
  }
  if (typeof body.linkedDealId === "string" && body.linkedDealId.trim()) {
    where.linkedDealId = body.linkedDealId.trim();
  }
  if (typeof body.severity === "string" && body.severity.trim()) {
    where.severity = body.severity.trim();
  }

  const dateFrom = body.dateFrom ? new Date(String(body.dateFrom)) : null;
  const dateTo = body.dateTo ? new Date(String(body.dateTo)) : null;
  if (dateFrom && !Number.isNaN(dateFrom.getTime()) && dateTo && !Number.isNaN(dateTo.getTime())) {
    where.eventTimestamp = { gte: dateFrom, lte: dateTo };
  } else if (dateFrom && !Number.isNaN(dateFrom.getTime())) {
    where.eventTimestamp = { gte: dateFrom };
  } else if (dateTo && !Number.isNaN(dateTo.getTime())) {
    where.eventTimestamp = { lte: dateTo };
  }

  const take = typeof body.take === "number" && body.take > 0 && body.take <= 500 ? body.take : 200;

  const records = await prisma.complianceAuditRecord.findMany({
    where,
    orderBy: { eventTimestamp: "desc" },
    take,
  });

  return NextResponse.json({ success: true, records });
}
