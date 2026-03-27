import { LecipmWorkspaceInviteStatus, LecipmWorkspaceRole, type PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/email/send";
import { appendWorkspaceAuditLog } from "./workspaceAuditLogService";
import { createWorkspaceInvite, hashInviteToken } from "./enterpriseWorkspaceService";

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}` : "") ||
    "http://localhost:3000"
  );
}

/**
 * Organization invite: creates workspace invite row and optionally emails the recipient.
 * Maps to `EnterpriseWorkspace` + `enterprise_workspace_invites` (multi-tenant org layer).
 */
export async function inviteUserToOrganization(
  db: PrismaClient,
  args: {
    workspaceId: string;
    invitedByUserId: string;
    email: string;
    role: LecipmWorkspaceRole;
    seatLimit: number;
    sendInviteEmail: boolean;
    organizationName?: string;
  }
): Promise<{ ok: true; inviteId: string; expiresAt: Date; rawToken: string } | { ok: false; error: string }> {
  const result = await createWorkspaceInvite(db, {
    workspaceId: args.workspaceId,
    invitedByUserId: args.invitedByUserId,
    email: args.email,
    role: args.role,
    seatLimit: args.seatLimit,
  });

  if ("error" in result) {
    return { ok: false, error: String(result.error) };
  }

  const { invite, rawToken } = result;
  const acceptUrl = `${appBaseUrl()}/dashboard/workspaces/accept-invite?token=${encodeURIComponent(rawToken)}`;

  if (args.sendInviteEmail) {
    const org = args.organizationName?.trim() || "your organization";
    await sendEmail({
      to: args.email.trim().toLowerCase(),
      subject: `Invitation to join ${org} on LECIPM`,
      html: `<p>You have been invited to join <strong>${escapeHtml(org)}</strong> as <strong>${escapeHtml(String(args.role))}</strong>.</p>
<p><a href="${acceptUrl}">Accept invitation</a></p>
<p>This link expires in 14 days. If you did not expect this email, you can ignore it.</p>`,
    });
  }

  return { ok: true, inviteId: invite.id, expiresAt: invite.expiresAt, rawToken };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function acceptWorkspaceInvite(
  db: PrismaClient,
  args: { token: string; userId: string }
): Promise<
  | { ok: true; workspaceId: string; role: LecipmWorkspaceRole }
  | { ok: false; error: string; status: 400 | 401 | 403 | 404 | 409 | 410 }
> {
  const token = args.token?.trim();
  if (!token) {
    return { ok: false, error: "Token required", status: 400 };
  }

  const user = await db.user.findUnique({
    where: { id: args.userId },
    select: { email: true },
  });
  if (!user?.email?.trim()) {
    return { ok: false, error: "Account email required to accept invite", status: 403 };
  }
  const emailNorm = user.email.trim().toLowerCase();
  const tokenHash = hashInviteToken(token);

  const invite = await db.enterpriseWorkspaceInvite.findFirst({
    where: { tokenHash, status: LecipmWorkspaceInviteStatus.pending },
    include: { workspace: { select: { id: true, name: true } } },
  });

  if (!invite) {
    return { ok: false, error: "Invalid or expired invite", status: 404 };
  }

  if (invite.expiresAt.getTime() < Date.now()) {
    await db.enterpriseWorkspaceInvite.update({
      where: { id: invite.id },
      data: { status: LecipmWorkspaceInviteStatus.expired },
    });
    return { ok: false, error: "Invite expired", status: 410 };
  }

  if (invite.email !== emailNorm) {
    return { ok: false, error: "Signed-in email does not match invite", status: 403 };
  }

  const existing = await db.enterpriseWorkspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: args.userId } },
  });
  if (existing) {
    await db.enterpriseWorkspaceInvite.update({
      where: { id: invite.id },
      data: { status: LecipmWorkspaceInviteStatus.accepted },
    });
    return { ok: true, workspaceId: invite.workspaceId, role: existing.role };
  }

  await db.$transaction(async (tx) => {
    await tx.enterpriseWorkspaceMember.create({
      data: {
        workspaceId: invite.workspaceId,
        userId: args.userId,
        role: invite.role,
      },
    });
    await tx.enterpriseWorkspaceInvite.update({
      where: { id: invite.id },
      data: { status: LecipmWorkspaceInviteStatus.accepted },
    });
    await appendWorkspaceAuditLog(tx, {
      workspaceId: invite.workspaceId,
      actorUserId: args.userId,
      action: "workspace_setting_change",
      entityType: "member",
      entityId: args.userId,
      metadata: { event: "invite_accepted", inviteId: invite.id },
    });
  });

  return { ok: true, workspaceId: invite.workspaceId, role: invite.role };
}
