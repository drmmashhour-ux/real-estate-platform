import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export function generateReferralCode(prefix = "USER"): string {
  return `${prefix}${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Unique row id for viral / multi-referee attribution (host flow uses its own generator). */
export function generateViralReferralInstanceCode(): string {
  return `V${randomBytes(6).toString("hex").toUpperCase()}`;
}

/**
 * Public share code (`User.referralCode` + `ReferralCode` row). New users get collision-safe `REF-…` codes.
 * Dynamic import avoids a static cycle with `lib/growth/referral` (which uses `createReferralIfNeeded`).
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode) {
    const { ensureReferralCodeLinked } = await import("@/lib/growth/referral");
    return ensureReferralCodeLinked(userId);
  }
  const { generateReferralCode: gen } = await import("@/lib/growth/referral");
  return gen(userId);
}
