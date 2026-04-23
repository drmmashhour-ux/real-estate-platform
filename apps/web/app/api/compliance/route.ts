import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { logComplianceTagged } from "@/lib/server/launch-logger";

export const dynamic = "force-dynamic";

/**
 * Compliance + insurance snapshot for broker console.
 * No `complianceEvent` model — uses `ComplianceCase`, `ComplianceAuditLog`, `InsuranceLead`.
 */
export async function GET(_request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== PlatformRole.BROKER && user?.role !== PlatformRole.ADMIN) {
      return NextResponse.json({ error: "Broker access required" }, { status: 403 });
    }

    const isAdmin = user.role === PlatformRole.ADMIN;

    const caseWhere = isAdmin
      ? {}
      : {
          OR: [{ deal: { brokerId: userId } }, { listing: { ownerId: userId } }],
        };

    const cases = await prisma.complianceCase.findMany({
      where: caseWhere,
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        caseType: true,
        severity: true,
        status: true,
        summary: true,
        createdAt: true,
        dealId: true,
        listingId: true,
      },
    });

    const auditWhere = isAdmin
      ? {}
      : {
          OR: [
            { actorUserId: userId },
            {
              complianceCase: {
                OR: [{ deal: { brokerId: userId } }, { listing: { ownerId: userId } }],
              },
            },
          ],
        };

    const auditLogs = await prisma.complianceAuditLog.findMany({
      where: auditWhere,
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        actionKey: true,
        createdAt: true,
        caseId: true,
        payload: true,
      },
    });

    const insuranceWhere = isAdmin
      ? {}
      : {
          OR: [{ assignedBrokerUserId: userId }, { userId }],
        };

    const insuranceLeads = await prisma.insuranceLead.findMany({
      where: insuranceWhere,
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        email: true,
        fullName: true,
        leadType: true,
        status: true,
        source: true,
        leadScore: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ cases, auditLogs, insuranceLeads });
  } catch (e) {
    logComplianceTagged.error("GET /api/compliance failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Failed to load compliance data" }, { status: 500 });
  }
}
