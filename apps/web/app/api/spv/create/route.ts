import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createPrivatePlacementSpv } from "@/modules/amf-private-placement/amf-private-placement.service";

export const dynamic = "force-dynamic";

/** POST — create deal-scoped AMF private-placement SPV (non-public workflow; simulation-first by default). */
export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { dealId?: string; issuerLegalName?: string; counselApprovedRealMode?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dealId = typeof body.dealId === "string" ? body.dealId.trim() : "";
  const issuerLegalName = typeof body.issuerLegalName === "string" ? body.issuerLegalName.trim() : "";
  if (!dealId || !issuerLegalName) {
    return NextResponse.json({ error: "dealId and issuerLegalName required" }, { status: 400 });
  }

  try {
    const spv = await createPrivatePlacementSpv({
      dealId,
      issuerLegalName,
      actorUserId: userId,
      actorRole: user.role,
      counselApprovedRealMode: body.counselApprovedRealMode === true,
    });
    return NextResponse.json({
      ok: true,
      spvId: spv.id,
      disclaimer:
        "Simulation-first private placement shell. No securities are offered; counsel must enable real mode and complete filings before accepting investor proceeds.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    const status =
      msg === "DEAL_NOT_FOUND" ? 404
      : msg === "BROKER_DEAL_ACCESS_REQUIRED" || msg === "SPV_ALREADY_EXISTS_FOR_DEAL" ? 403
      : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
