import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { engineFlags } from "@/config/feature-flags";

const TAG = "[growth.brokerAcquisition]";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Comma-separated emails that may use LECIPM SD tools when early access is on (e.g. founders). */
function earlyAccessAllowlist(): Set<string> {
  const raw = process.env.LECIPM_EARLY_BROKER_EMAIL_ALLOWLIST ?? "";
  const set = new Set<string>();
  for (const p of raw.split(",")) {
    const e = normalizeEmail(p);
    if (e) set.add(e);
  }
  return set;
}

/**
 * When `FEATURE_EARLY_BROKER_V1` is enabled, only allowlisted emails or accepted invites may use broker SD flows.
 */
export async function assertEarlyBrokerAccess(userId: string, actorRole: PlatformRole): Promise<void> {
  if (!engineFlags.earlyBrokerV1) return;
  if (actorRole === "ADMIN") return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });
  if (!user?.email) throw new Error("Early access: user email required.");
  const email = normalizeEmail(user.email);

  if (earlyAccessAllowlist().has(email)) return;

  const accepted = await prisma.lecipmBrokerInvite.findFirst({
    where: {
      email,
      status: "ACCEPTED",
      acceptedByUserId: userId,
    },
    select: { id: true },
  });
  if (accepted) return;

  throw new Error(
    "LECIPM early access: your brokerage account must be invited (Québec broker program). Contact support or use your invite link."
  );
}

export async function sendInvite(args: { email: string; invitedByUserId?: string | null }) {
  const email = normalizeEmail(args.email);
  if (!email.includes("@")) throw new Error("Invalid email");

  const existing = await prisma.lecipmBrokerInvite.findFirst({
    where: { email, status: "PENDING" },
  });
  if (existing) {
    logInfo(TAG, { action: "sendInvite.duplicate", email });
    return { invite: existing, token: existing.inviteToken, alreadyPending: true as const };
  }

  const invite = await prisma.lecipmBrokerInvite.create({
    data: {
      email,
      invitedByUserId: args.invitedByUserId ?? null,
      status: "PENDING",
    },
  });

  logInfo(TAG, { action: "sendInvite.created", inviteId: invite.id, email });
  return { invite, token: invite.inviteToken, alreadyPending: false as const };
}

export async function acceptInvite(args: { token: string; userId: string }) {
  const token = args.token.trim();
  const invite = await prisma.lecipmBrokerInvite.findUnique({
    where: { inviteToken: token },
  });
  if (!invite) throw new Error("Invalid or expired invite token.");

  const user = await prisma.user.findUnique({
    where: { id: args.userId },
    select: { email: true },
  });
  if (!user?.email) throw new Error("User email required to accept invite.");
  if (normalizeEmail(user.email) !== normalizeEmail(invite.email)) {
    throw new Error("This invite was sent to a different email address.");
  }

  if (invite.status === "ACCEPTED" && invite.acceptedByUserId === args.userId) {
    return invite;
  }
  if (invite.status === "ACCEPTED") {
    throw new Error("Invite already used.");
  }

  const updated = await prisma.lecipmBrokerInvite.update({
    where: { id: invite.id },
    data: {
      status: "ACCEPTED",
      acceptedByUserId: args.userId,
      acceptedAt: new Date(),
    },
  });

  logInfo(TAG, { action: "acceptInvite", inviteId: invite.id, userId: args.userId });
  return updated;
}

export async function getBrokerAcquisitionScripts() {
  // Placeholder to fix build error
  return [];
}
