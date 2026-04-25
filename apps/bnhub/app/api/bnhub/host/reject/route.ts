import { NextRequest } from "next/server";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export async function POST(request: NextRequest) {
  const role = await getUserRole();
  if (!isHubAdminRole(role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { hostId } = body as { hostId?: string };
    if (!hostId) {
      return Response.json({ error: "hostId required" }, { status: 400 });
    }

    const host = await prisma.bnhubHost.update({
      where: { id: hostId },
      data: { status: "rejected" },
    });
    return Response.json(host);
  } catch (e) {
    console.error("POST /api/bnhub/host/reject:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Reject failed" },
      { status: 400 }
    );
  }
}
