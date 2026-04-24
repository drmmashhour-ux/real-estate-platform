import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getInvestmentComplianceSummary } from "@/modules/amf-private-placement/amf-private-placement.service";

export const dynamic = "force-dynamic";

/** GET — dashboard payload: SPV issuers, 45-106 queue, investor eligibility queue (broker-scoped or admin). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const summary = await getInvestmentComplianceSummary({ actorUserId: userId, actorRole: user.role });
  return NextResponse.json({
    ok: true,
    ...summary,
    disclaimer:
      "Operational simulation and checklist tracking only — not legal advice. Counsel must review all Québec AMF filings and exemption classifications before real investor proceeds.",
  });
}
