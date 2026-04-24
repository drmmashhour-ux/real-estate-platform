import { NextResponse } from "next/server";
import { AmfExemptionCategory, PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { setExemptDistributionForSpv } from "@/modules/amf-private-placement/amf-private-placement.service";

export const dynamic = "force-dynamic";

const EXEMPTION_VALUES = new Set<string>(Object.values(AmfExemptionCategory));

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: spvId } = await context.params;

  let body: { exemptionType?: string; distributionDate?: string; notes?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const exemptionType = body.exemptionType as AmfExemptionCategory;
  if (!exemptionType || !EXEMPTION_VALUES.has(exemptionType)) {
    return NextResponse.json({ error: "Invalid exemptionType" }, { status: 400 });
  }

  const distributionDate = body.distributionDate ? new Date(body.distributionDate) : null;
  if (!distributionDate || Number.isNaN(distributionDate.getTime())) {
    return NextResponse.json({ error: "distributionDate (ISO) required" }, { status: 400 });
  }

  try {
    const row = await setExemptDistributionForSpv({
      spvId,
      exemptionType,
      distributionDate,
      notes: body.notes ?? null,
      actorUserId: userId,
      actorRole: user.role,
    });
    return NextResponse.json({
      ok: true,
      exemptDistributionId: row.id,
      filingDeadline: row.filingDeadline.toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status =
      msg === "SPV_DEAL_NOT_LINKED" || msg === "SPV_NOT_FOUND" ? 404
      : msg === "BROKER_DEAL_ACCESS_REQUIRED" ? 403
      : msg === "EXEMPTION_NOT_ENABLED_FOR_SPV" ? 403
      : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
