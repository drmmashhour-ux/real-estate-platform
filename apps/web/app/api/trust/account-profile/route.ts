import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireBrokerOrAdminTrustSession } from "@/lib/compliance/trust-route-guard";

export const dynamic = "force-dynamic";

/**
 * GET /api/trust/account-profile — Trust profiles the session may use (solo broker + optional agency id match).
 */
export async function GET() {
  const session = await requireBrokerOrAdminTrustSession();
  if (!session.ok) return session.response;

  if (session.role === PlatformRole.ADMIN) {
    const profiles = await prisma.trustAccountProfile.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ success: true, profiles });
  }

  const profiles = await prisma.trustAccountProfile.findMany({
    where: { ownerType: "solo_broker", ownerId: session.userId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ success: true, profiles });
}
