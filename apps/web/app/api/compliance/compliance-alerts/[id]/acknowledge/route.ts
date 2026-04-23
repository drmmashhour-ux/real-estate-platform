import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { assertComplianceOwnerAccess } from "@/lib/compliance/compliance-access";

export const dynamic = "force-dynamic";

/** Acknowledge a `ComplianceAlert` (command-center cockpit item). */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER && auth.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ success: false, error: "ALERT_ID_REQUIRED" }, { status: 400 });
  }

  const row = await prisma.complianceAlert.findUnique({ where: { id: id.trim() } });
  if (!row) {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const access = await assertComplianceOwnerAccess(auth.user, row.ownerType, row.ownerId);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.message }, { status: 403 });
  }

  const updated = await prisma.complianceAlert.update({
    where: { id: row.id },
    data: {
      acknowledged: true,
      acknowledgedById: auth.user.id,
      acknowledgedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    alert: updated,
    acknowledgedById: auth.user.id,
  });
}
