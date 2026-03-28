/**
 * Public API billing / quotas. When `platform_public_api_keys` is migrated, wire to Prisma.
 */

export async function assertWithinMonthlyQuota(_keyId: string): Promise<{ ok: true; usage: number; quota: number }> {
  return { ok: true, usage: 0, quota: 1_000_000 };
}

export function requestsPerMinuteForPlan(plan: string): number {
  const p = (plan ?? "free").toLowerCase();
  if (p.includes("enterprise")) return 600;
  if (p.includes("pro")) return 240;
  return 60;
}
