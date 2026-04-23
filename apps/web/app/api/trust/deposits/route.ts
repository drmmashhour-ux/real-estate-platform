import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireBrokerOrAdminTrustSession } from "@/lib/compliance/trust-route-guard";

export const dynamic = "force-dynamic";

/** GET /api/trust/deposits — List trust deposits visible to the broker (or all for admin). */
export async function GET() {
  const session = await requireBrokerOrAdminTrustSession();
  if (!session.ok) return session.response;

  const deposits = await prisma.trustDeposit.findMany({
    where: session.role === PlatformRole.ADMIN ? {} : { brokerId: session.userId },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      trustAccountProfile: {
        select: { id: true, ownerType: true, trustAccountEnabled: true, accountStatus: true },
      },
    },
  });

  return NextResponse.json({ success: true, deposits });
}
