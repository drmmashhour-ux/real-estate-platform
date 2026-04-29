export { VIRAL_REF_COOKIE, VIRAL_REF_COOKIE_MAX_AGE } from "./viral.constants";
import { prisma } from "@/lib/db";
import { ensureReferralCode } from "@/lib/referrals/code";

const CUID_LIKE = /^c[a-z0-9]{20,32}$/i;
const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeSignupRefParam(raw: string | undefined | null): string {
  if (raw == null || typeof raw !== "string") return "";
  const t = raw.trim();
  if (!t) return "";
  if (CUID_LIKE.test(t) || UUID_LIKE.test(t)) return t;
  return t.toUpperCase();
}

export type ReferralAttribution = { referrerId: string; publicCode: string };

/**
 * Resolve `ref` query param: either sharer’s `User.id` (invite link) or their `User.referralCode`.
 */
export async function resolveReferralAttribution(raw: string | null | undefined): Promise<ReferralAttribution | null> {
  if (raw == null || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;

  if (CUID_LIKE.test(t) || UUID_LIKE.test(t)) {
    const u = await prisma.user.findUnique({
      where: { id: t },
      select: { id: true, referralCode: true },
    });
    if (!u) return null;
    const publicCode = (u.referralCode ?? (await ensureReferralCode(u.id))).toUpperCase();
    return { referrerId: u.id, publicCode };
  }

  const upper = t.toUpperCase();
  const u = await prisma.user.findFirst({
    where: { referralCode: upper },
    select: { id: true, referralCode: true },
  });
  if (!u?.referralCode) return null;
  return { referrerId: u.id, publicCode: u.referralCode.toUpperCase() };
}

/** Public code for `ReferralEvent` / analytics (not necessarily row `code`). */
export async function getPublicCodeForReferralRow(row: {
  referralPublicCode: string | null;
  referrerId: string;
  code: string;
}): Promise<string> {
  if (row.referralPublicCode?.trim()) return row.referralPublicCode.trim().toUpperCase();
  const u = await prisma.user.findUnique({
    where: { id: row.referrerId },
    select: { referralCode: true },
  });
  if (u?.referralCode) return u.referralCode.toUpperCase();
  return row.code;
}

/**
 * K-factor style: signups ÷ max(1, invite_sent) for users who shared this code.
 * Clicks included as weaker top-of-funnel signal.
 */
export async function computeViralCoefficientForReferrer(publicCodes: string[]): Promise<{
  invitesSent: number;
  signups: number;
  conversions: number;
  viralCoefficient: number;
}> {
  if (publicCodes.length === 0) {
    return { invitesSent: 0, signups: 0, conversions: 0, viralCoefficient: 0 };
  }
  const [invitesSent, signups, conversions] = await Promise.all([
    prisma.referralEvent.count({ where: { code: { in: publicCodes }, eventType: "invite_sent" } }).catch(() => 0),
    prisma.referralEvent.count({ where: { code: { in: publicCodes }, eventType: "signup" } }).catch(() => 0),
    prisma.referralEvent.count({ where: { code: { in: publicCodes }, eventType: "paid" } }).catch(() => 0),
  ]);
  const denom = Math.max(1, invitesSent);
  return {
    invitesSent,
    signups,
    conversions,
    viralCoefficient: signups / denom,
  };
}
