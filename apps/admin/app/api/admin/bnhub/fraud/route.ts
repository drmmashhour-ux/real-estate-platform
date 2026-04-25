import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { bnhubV2Flags } from "@/config/feature-flags";
import { BnhubFraudFlagStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!bnhubV2Flags.bnhubAdminControlV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const flags = await prisma.bnhubFraudFlag.findMany({
    where: {
      status: { in: [BnhubFraudFlagStatus.OPEN, BnhubFraudFlagStatus.UNDER_REVIEW, BnhubFraudFlagStatus.ESCALATED] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      listingId: true,
      hostUserId: true,
      flagType: true,
      severity: true,
      status: true,
      summary: true,
      createdAt: true,
    },
  });

  return Response.json({ flags });
}
