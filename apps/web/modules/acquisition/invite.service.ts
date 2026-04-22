import { randomBytes } from "crypto";

import { prisma } from "@/lib/db";

import { syncRelationshipFromPipeline } from "./acquisition.constants";
import { notifyAcquisitionAdmins } from "./acquisition-notifications.service";

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "LEC";
  const buf = randomBytes(12);
  for (let i = 0; i < 8; i++) s += chars[buf[i] % chars.length]!;
  return s;
}

function randomToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createAcquisitionInvite(opts: {
  contactId?: string | null;
  inviterUserId?: string | null;
  inviteeEmail?: string | null;
}): Promise<{ code: string; token: string }> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode();
    const token = randomToken();
    try {
      await prisma.lecipmAcquisitionInvite.create({
        data: {
          code,
          token,
          contactId: opts.contactId ?? undefined,
          inviterUserId: opts.inviterUserId ?? undefined,
          inviteeEmail: opts.inviteeEmail ?? undefined,
        },
      });
      return { code, token };
    } catch {
      continue;
    }
  }
  throw new Error("invite_code_collision");
}

export function inviteLandingPath(code: string): string {
  return `/invite?code=${encodeURIComponent(code)}`;
}

/**
 * Call after signup when `referralCode` / invite code matches an acquisition invite.
 */
export async function redeemAcquisitionInvite(code: string, inviteeUserId: string): Promise<boolean> {
  const row = await prisma.lecipmAcquisitionInvite.findUnique({
    where: { code },
    include: { contact: true },
  });
  if (!row || row.redeemedAt || row.inviteeUserId) return false;

  await prisma.lecipmAcquisitionInvite.update({
    where: { id: row.id },
    data: {
      redeemedAt: new Date(),
      inviteeUserId,
    },
  });

  if (row.contactId) {
    const contact = await prisma.lecipmAcquisitionContact.findUnique({ where: { id: row.contactId } });
    if (contact) {
      await prisma.lecipmAcquisitionContact.update({
        where: { id: contact.id },
        data: {
          linkedUserId: inviteeUserId,
          pipelineStage: "CONVERTED",
          relationshipStatus: syncRelationshipFromPipeline("CONVERTED"),
          convertedAt: new Date(),
          timeToOnboardMs: Math.max(0, Date.now() - contact.createdAt.getTime()),
        },
      });
    }

    await notifyAcquisitionAdmins("acquisition_conversion", {
      contactId: row.contactId,
      inviteeUserId,
      code: row.code,
    });
  }

  return true;
}

export async function getInviteConversionStats(): Promise<{ issued: number; redeemed: number; rate: number }> {
  const [issued, redeemed] = await Promise.all([
    prisma.lecipmAcquisitionInvite.count(),
    prisma.lecipmAcquisitionInvite.count({ where: { redeemedAt: { not: null } } }),
  ]);
  const rate = issued === 0 ? 0 : redeemed / issued;
  return { issued, redeemed, rate };
}
