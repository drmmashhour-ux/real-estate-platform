import { prisma } from "@/lib/db";
import { adjustTrustScore } from "@/lib/sybnb/trust-score";

/**
 * Lightweight, synchronous-ish fraud scoring — single `UPDATE` per event (no joins).
 * Skips synthetic/demo users (`is_test`, `demo_meta.demo`).
 */

export type FraudScoreEvent =
  /** +20 — suspicious chat (medium/high from {@link analyzeMessage}) */
  | "chat_risk"
  /** +30 — second+ message with external-payment signal for this sender */
  | "external_payment_repeat"
  /** +15 — third or more booking request within 1 hour */
  | "rapid_booking_requests"
  /** +50 — manual moderation */
  | "admin_manual_flag"
  /** −10 — host approved the guest’s request (good-faith signal) */
  | "booking_approved_good";

const THRESHOLD_FLAG = 60;

const DELTA: Record<FraudScoreEvent, number> = {
  chat_risk: 20,
  external_payment_repeat: 30,
  rapid_booking_requests: 15,
  admin_manual_flag: 50,
  booking_approved_good: -10,
};

/**
 * Atomically adjusts `fraud_score`, sets `fraud_flag` when new score reaches ≥60 (sticky true once crossed).
 */
export async function updateFraudScore(userId: string, event: FraudScoreEvent): Promise<void> {
  const trimmed = userId.trim();
  if (!trimmed) return;

  const prior = await prisma.syriaAppUser.findUnique({
    where: { id: trimmed },
    select: { fraudFlag: true },
  });

  const delta = DELTA[event];

  await prisma.$executeRaw`
    UPDATE syria_users
    SET
      fraud_score = GREATEST(
        0,
        LEAST(COALESCE(fraud_score, 0) + ${delta}, 1000000)
      ),
      fraud_flag =
        COALESCE(fraud_flag, false)
        OR (
          GREATEST(
            0,
            LEAST(COALESCE(fraud_score, 0) + ${delta}, 1000000)
          ) >= ${THRESHOLD_FLAG}
        )
    WHERE id = ${trimmed}
      AND COALESCE(is_test, false) = false
      AND (
        demo_meta IS NULL
        OR NOT (demo_meta::jsonb @> '{"demo":true}'::jsonb)
      )
  `;

  const post = await prisma.syriaAppUser.findUnique({
    where: { id: trimmed },
    select: { fraudFlag: true },
  });
  if (!prior?.fraudFlag && post?.fraudFlag) {
    void adjustTrustScore(trimmed, -20);
  }
}

/** Manual moderation (+50). Wire from admin tooling only. */
export async function applyManualSybnbFraudSanction(userId: string): Promise<void> {
  await updateFraudScore(userId, "admin_manual_flag");
}
