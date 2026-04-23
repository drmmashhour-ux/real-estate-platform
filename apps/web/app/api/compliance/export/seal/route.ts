import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { assertComplianceOwnerAccess } from "@/lib/compliance/compliance-access";
import { assertExportBundleNotSealed } from "@/lib/compliance/audit-guards";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";
import { enforceComplianceAction } from "@/lib/compliance/enforce-compliance-action";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER && auth.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const bundleId = typeof body.bundleId === "string" ? body.bundleId.trim() : "";
  if (!bundleId) {
    return NextResponse.json({ success: false, error: "BUNDLE_ID_REQUIRED" }, { status: 400 });
  }

  const existing = await prisma.complianceExportBundle.findUnique({ where: { id: bundleId } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const access = await assertComplianceOwnerAccess(auth.user, existing.ownerType, existing.ownerId);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.message }, { status: 403 });
  }

  const blocked = await rejectIfInspectionReadOnlyMutation(req, {
    ownerType: existing.ownerType,
    ownerId: existing.ownerId,
    actorId: auth.user.id,
    actorType: auth.user.role === PlatformRole.ADMIN ? "admin" : "broker",
  });
  if (blocked) return blocked;

  const guard = await enforceComplianceAction({
    ownerType: existing.ownerType,
    ownerId: existing.ownerId,
    moduleKey: "audit",
    actionKey: "seal_export_bundle",
    entityType: "export_bundle",
    entityId: existing.id,
    actorType: auth.user.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: auth.user.id,
    facts: { bundleStatus: existing.status },
  });
  if (!guard.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: guard.reasonCode ?? "SEAL_BLOCKED",
        message: guard.message,
        decisionId: guard.decisionId,
      },
      { status: 403 },
    );
  }

  try {
    assertExportBundleNotSealed(existing);
  } catch (e) {
    if (e instanceof Error && e.message === "SEALED_EXPORT_IMMUTABLE") {
      return NextResponse.json({ success: false, error: "ALREADY_SEALED" }, { status: 400 });
    }
    throw e;
  }

  const bundle = await prisma.complianceExportBundle.update({
    where: { id: bundleId },
    data: {
      status: "sealed",
      sealedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, bundle });
}
