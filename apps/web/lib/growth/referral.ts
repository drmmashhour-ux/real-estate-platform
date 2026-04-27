import { createHash, randomBytes } from "node:crypto";

import { getLegacyDB } from "@/lib/db/legacy";
import { createReferralIfNeeded } from "@/lib/referrals";
import { trackEvent } from "@/src/services/analytics";

const prisma = getLegacyDB();

const MAX_GENERATION_ATTEMPTS = 3;
const MAX_REFERRALS_PER_OWNER_PER_UTC_DAY = 10;
/** Eligible for reward analytics / copy when this many successful referrals exist (see `getReferralReward`). */
const REWARD_THRESHOLD_COUNT = 5;

export type TrackReferralResult = {
  applied: boolean;
  totalReferrals: number;
  rewardTriggered: boolean;
};

/**
 * `REF-` + high-entropy suffix (not derived from user id) — collision-resistant with DB retries.
 */
function randomRefToken(): string {
  const n = randomBytes(4).readUInt32BE(0);
  const b36 = n.toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (b36 + randomBytes(2).toString("hex").toUpperCase()).slice(0, 8);
}

function normalizePublicCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Create a durable public code row + set {@link User.referralCode} (recommendation-safe; no payouts).
 * Retries on rare PK collisions.
 */
export async function generateReferralCode(userId: string): Promise<string> {
  for (let i = 0; i < MAX_GENERATION_ATTEMPTS; i++) {
    const code = `REF-${randomRefToken()}`;
    try {
      await prisma.$transaction([
        prisma.referralCode.create({ data: { code, ownerUserId: userId } }),
        prisma.user.update({ where: { id: userId }, data: { referralCode: code } }),
      ]);
      return code;
    } catch {
      /* unique collision — retry */
    }
  }
  throw new Error("REFERRAL_CODE_GENERATION_FAILED");
}

/**
 * When user already has {@link User.referralCode} but no `ReferralCode` row (legacy), backfill the row.
 */
export async function ensureReferralCodeLinked(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (u?.referralCode) {
    await prisma.referralCode.upsert({
      where: { code: u.referralCode },
      create: { code: u.referralCode, ownerUserId: userId },
      update: {},
    });
    return u.referralCode;
  }
  return generateReferralCode(userId);
}

function startOfCurrentUtcDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Optional abuse signal — hashed, not reversible (Order 49). */
export function hashReferralFingerprint(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex").slice(0, 32);
}

/**
 * Record referral signup: resolves owner via `ReferralCode` + `User.referralCode`, enforces self-ref + daily cap,
 * then delegates to {@link createReferralIfNeeded} (idempotent on referee).
 * Recommendations / analytics only — no payouts in this function.
 */
export async function trackReferral(
  code: string,
  newUserId: string,
  ownerUserId?: string
): Promise<TrackReferralResult> {
  const publicCode = normalizePublicCode(code);
  if (!publicCode.startsWith("REF-")) {
    return { applied: false, totalReferrals: 0, rewardTriggered: false };
  }

  const refRow = await prisma.referralCode.findUnique({ where: { code: publicCode } }).catch(() => null);
  const owner =
    ownerUserId ??
    refRow?.ownerUserId ??
    (await prisma.user
      .findFirst({ where: { referralCode: publicCode }, select: { id: true } })
      .then((u) => u?.id)) ??
    null;

  if (!owner) {
    return { applied: false, totalReferrals: 0, rewardTriggered: false };
  }
  if (owner === newUserId) {
    return { applied: false, totalReferrals: 0, rewardTriggered: false };
  }

  const today = startOfCurrentUtcDay();
  const todays = await prisma.referral.count({
    where: { referrerId: owner, createdAt: { gte: today } },
  });
  if (todays >= MAX_REFERRALS_PER_OWNER_PER_UTC_DAY) {
    return { applied: false, totalReferrals: 0, rewardTriggered: false };
  }

  const existingPair = await prisma.referral.count({
    where: { referrerId: owner, usedByUserId: newUserId },
  });
  if (existingPair > 0) {
    const total = await prisma.referral.count({
      where: { referrerId: owner, usedByUserId: { not: null } },
    });
    return {
      applied: false,
      totalReferrals: total,
      rewardTriggered: total >= REWARD_THRESHOLD_COUNT,
    };
  }

  const created = await createReferralIfNeeded(publicCode, newUserId);
  if (!created) {
    return { applied: false, totalReferrals: 0, rewardTriggered: false };
  }

  const total = await prisma.referral.count({
    where: { referrerId: owner, usedByUserId: { not: null } },
  });
  const rewardTriggered = total >= REWARD_THRESHOLD_COUNT;
  if (rewardTriggered) {
    void trackEvent("referral_reward_eligible", { ownerUserId: owner, totalReferrals: total }, { userId: owner });
  }
  void trackEvent("referral_tracked", { code: publicCode, ownerUserId: owner, newUserId }, { userId: newUserId });
  return { applied: true, totalReferrals: total, rewardTriggered };
}

export type ReferralStats = {
  code: string;
  totalReferrals: number;
};

export async function getReferralStatsForUser(userId: string): Promise<ReferralStats> {
  const code = await ensureReferralCodeLinked(userId);
  const totalReferrals = await prisma.referral.count({
    where: { referrerId: userId, usedByUserId: { not: null } },
  });
  return { code, totalReferrals };
}

/**
 * One-line copy for messages / SMS / social; use with a shareable `link` (e.g. `/landing?ref=…`).
 */
export function getReferralMessage(link: string) {
  return `Get early access to better listings: ${link}`;
}
