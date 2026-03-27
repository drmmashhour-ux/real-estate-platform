import { createHash, randomBytes } from "crypto";
import { LecipmWorkspaceInviteStatus, LecipmWorkspaceRole } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { appendWorkspaceAuditLog } from "./workspaceAuditLogService";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export async function createEnterpriseWorkspace(
  db: PrismaClient,
  args: { userId: string; name: string; slug?: string | null }
) {
  const slug = (args.slug?.trim() || slugify(args.name)) || randomBytes(4).toString("hex");
  return db.$transaction(async (tx) => {
    const ws = await tx.enterpriseWorkspace.create({
      data: {
        name: args.name.trim(),
        slug,
        createdByUserId: args.userId,
        seatLimit: 10,
        planTier: "team",
      },
    });
    await tx.enterpriseWorkspaceMember.create({
      data: {
        workspaceId: ws.id,
        userId: args.userId,
        role: LecipmWorkspaceRole.owner,
      },
    });
    await appendWorkspaceAuditLog(tx, {
      workspaceId: ws.id,
      actorUserId: args.userId,
      action: "workspace_setting_change",
      entityType: "workspace",
      entityId: ws.id,
      metadata: { event: "created", name: ws.name },
    });
    return ws;
  });
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function newInviteToken(): string {
  return randomBytes(24).toString("hex");
}

export async function createWorkspaceInvite(
  db: PrismaClient,
  args: {
    workspaceId: string;
    invitedByUserId: string;
    email: string;
    role: LecipmWorkspaceRole;
    seatLimit: number;
  }
) {
  const email = args.email.trim().toLowerCase();
  const count = await db.enterpriseWorkspaceMember.count({ where: { workspaceId: args.workspaceId } });
  const pending = await db.enterpriseWorkspaceInvite.count({
    where: { workspaceId: args.workspaceId, status: LecipmWorkspaceInviteStatus.pending },
  });
  if (count + pending >= args.seatLimit) {
    return { error: "Seat limit reached" as const };
  }

  const token = newInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const invite = await db.enterpriseWorkspaceInvite.create({
    data: {
      workspaceId: args.workspaceId,
      email,
      role: args.role,
      tokenHash,
      invitedByUserId: args.invitedByUserId,
      expiresAt,
      status: LecipmWorkspaceInviteStatus.pending,
    },
  });

  await appendWorkspaceAuditLog(db, {
    workspaceId: args.workspaceId,
    actorUserId: args.invitedByUserId,
    action: "member_invited",
    entityType: "invite",
    entityId: invite.id,
    metadata: { email, role: args.role },
  });

  return { invite, rawToken: token };
}
