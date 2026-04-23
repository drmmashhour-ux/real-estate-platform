import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // 1. Get privacy officer
    const officer = await prisma.privacyOfficer.findFirst({
      where: { published: true },
    });

    // 2. Get incidents
    const incidents = await prisma.confidentialityIncident.findMany({
      orderBy: { discoveredAt: "desc" },
      take: 10,
    });

    // 3. Get complaints
    const complaints = await prisma.privacyComplaint.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // 4. Get audit logs
    const auditLogs = await prisma.privacyAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // 5. Get retention policies
    const policies = await prisma.privacyRetentionPolicy.findMany();

    return NextResponse.json({
      officer,
      incidents,
      complaints,
      auditLogs,
      policies,
    });
  } catch (error: any) {
    console.error("Admin privacy summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
