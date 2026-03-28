import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000;

/**
 * Create a new session; revokes all other active sessions for this user (single active login).
 * Returns opaque token stored in `lecipm_guest_id` cookie.
 */
export async function createDbSession(userId: string): Promise<string> {
  await prisma.session.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      revoked: false,
    },
  });

  return token;
}

/** Resolve cookie value → user id, or null if missing / revoked / expired. */
export async function resolveSessionTokenToUserId(raw: string | null | undefined): Promise<string | null> {
  const token = typeof raw === "string" ? raw.trim() : "";
  if (token.length < 32) return null;

  const row = await prisma.session.findFirst({
    where: {
      token,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
    select: { userId: true },
  });

  return row?.userId ?? null;
}

export async function revokeDbSessionByToken(raw: string | null | undefined): Promise<void> {
  const token = typeof raw === "string" ? raw.trim() : "";
  if (!token) return;
  await prisma.session.updateMany({
    where: { token },
    data: { revoked: true },
  });
}
