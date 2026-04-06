import { prisma } from "@/lib/db";
import { getMobileAuthUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/mobile/v1/bnhub/host/automated-messages — recent draft/sent automation logs for the host (Prisma user id).
 */
export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const appRole = await resolveMobileAppRoleFromRequest(request, user);
  if (appRole !== "host" && appRole !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.bnhubAutomatedHostMessageLog.findMany({
    where: { hostId: user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      bookingId: true,
      messageType: true,
      triggerType: true,
      status: true,
      recipient: true,
      content: true,
      locale: true,
      createdAt: true,
    },
  });

  return Response.json({
    logs: logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
