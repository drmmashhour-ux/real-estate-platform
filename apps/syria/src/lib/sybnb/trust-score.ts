import { prisma } from "@/lib/db";

/**
 * Adjusts `trust_score` by `delta`, clamped to [0, 100]. Skips demo/test users (same rules as fraud-score).
 */
export async function adjustTrustScore(userId: string, delta: number): Promise<void> {
  const id = userId.trim();
  if (!id || delta === 0) return;

  await prisma.$executeRaw`
    UPDATE syria_users
    SET trust_score = GREATEST(
      0,
      LEAST(COALESCE(trust_score, 50) + ${delta}, 100)
    )
    WHERE id = ${id}
      AND COALESCE(is_test, false) = false
      AND (
        demo_meta IS NULL
        OR NOT (demo_meta::jsonb @> '{"demo":true}'::jsonb)
      )
  `;
}
