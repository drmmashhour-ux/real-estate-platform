import { NextRequest, NextResponse } from "next/server";
import { LecipmWorkspaceRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { inviteUserToOrganization } from "@/modules/enterprise/infrastructure/organizationInviteService";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";

type Ctx = { params: Promise<{ id: string }> };

const ROLES = new Set<string>(Object.values(LecipmWorkspaceRole));

export const dynamic = "force-dynamic";

/** POST /api/workspaces/[id]/invites */
export async function POST(request: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  const { id: workspaceId } = await ctx.params;
  const auth = await requireWorkspacePermission(prisma, {
    userId,
    workspaceId,
    permission: "manage_members",
  });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    role?: string;
    sendInviteEmail?: boolean;
  };
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const roleRaw = typeof body.role === "string" ? body.role.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!roleRaw || !ROLES.has(roleRaw)) {
    return NextResponse.json({ error: "Valid role required" }, { status: 400 });
  }

  const ws = await prisma.enterpriseWorkspace.findUnique({
    where: { id: workspaceId },
    select: { seatLimit: true, name: true },
  });
  if (!ws) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sendInviteEmail = body.sendInviteEmail === true;
  const result = await inviteUserToOrganization(prisma, {
    workspaceId,
    invitedByUserId: userId!,
    email,
    role: roleRaw as LecipmWorkspaceRole,
    seatLimit: ws.seatLimit,
    sendInviteEmail,
    organizationName: ws.name,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({
    inviteId: result.inviteId,
    expiresAt: result.expiresAt.toISOString(),
    /** One-time token — omitted when email was sent (check inbox). */
    token: sendInviteEmail ? undefined : result.rawToken,
    emailSent: sendInviteEmail,
  });
}
