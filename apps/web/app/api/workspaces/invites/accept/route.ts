import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { acceptWorkspaceInvite } from "@/modules/enterprise/infrastructure/organizationInviteService";

export const dynamic = "force-dynamic";

/** POST /api/workspaces/invites/accept — body: { token } */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { token?: string };
  const token = typeof body.token === "string" ? body.token : "";
  const result = await acceptWorkspaceInvite(prisma, { token, userId });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    workspaceId: result.workspaceId,
    role: result.role,
  });
}
