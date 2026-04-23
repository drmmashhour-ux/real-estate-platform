import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { assertComplianceOwnerAccess } from "@/lib/compliance/compliance-access";
import { canOpenInspectionSession } from "@/lib/compliance/audit";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER && auth.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const ownerType = typeof body.ownerType === "string" ? body.ownerType.trim() : "";
  const ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";
  const reviewerType = typeof body.reviewerType === "string" ? body.reviewerType.trim() : "";
  const scopeType = typeof body.scopeType === "string" ? body.scopeType.trim() : "";

  if (!ownerType || !ownerId || !reviewerType || !scopeType) {
    return NextResponse.json({ success: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const access = await assertComplianceOwnerAccess(auth.user, ownerType, ownerId);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.message }, { status: 403 });
  }

  const blocked = await rejectIfInspectionReadOnlyMutation(req, {
    ownerType,
    ownerId,
    actorId: auth.user.id,
    actorType: auth.user.role === PlatformRole.ADMIN ? "admin" : "broker",
  });
  if (blocked) return blocked;

  const allowed = canOpenInspectionSession({
    reviewerType,
    revokedAt: null,
  });

  if (!allowed) {
    return NextResponse.json({ success: false, error: "INSPECTION_SESSION_NOT_ALLOWED" }, { status: 403 });
  }

  const session = await prisma.inspectionAccessSession.create({
    data: {
      sessionToken: randomBytes(24).toString("hex"),
      ownerType,
      ownerId,
      requestedById: typeof body.requestedById === "string" ? body.requestedById.trim() || auth.user.id : auth.user.id,
      reviewerType,
      scopeType,
      scopeId: typeof body.scopeId === "string" ? body.scopeId.trim() || null : null,
      readOnly: true,
      expiresAt: body.expiresAt ? new Date(String(body.expiresAt)) : null,
    },
  });

  return NextResponse.json({ success: true, session });
}
