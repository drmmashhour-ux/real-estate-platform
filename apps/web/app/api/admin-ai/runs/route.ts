import { getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const role = await getUserRole();
  if (!isHubAdminRole(role)) {
    return Response.json({ error: "Admin required" }, { status: 403 });
  }

  const runs = await prisma.adminAiRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return Response.json({ runs });
}
