import type { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEMO_RESET_KEEP_EMAILS_DEFAULT } from "@/lib/demo/demo-account-constants";
import { runSeed } from "@/prisma/seed";

function assertStagingOnly(): void {
  if (process.env.NEXT_PUBLIC_ENV !== "staging") {
    throw new Error("resetDemoDatabase: only allowed when NEXT_PUBLIC_ENV=staging");
  }
}

async function listPublicTableNames(): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('_prisma_migrations')`
  );
  return rows.map((r) => r.tablename);
}

async function truncateAllPublicTables(): Promise<void> {
  const names = await listPublicTableNames();
  if (names.length === 0) return;
  const quoted = names.map((n) => `"${n.replace(/"/g, '""')}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
}

function keepEmailList(): string[] {
  const raw = process.env.DEMO_RESET_KEEP_EMAILS?.trim() || `${DEMO_RESET_KEEP_EMAILS_DEFAULT},demo@platform.com`;
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function toCreateData(u: User): Prisma.UserUncheckedCreateInput {
  return {
    id: u.id,
    email: u.email,
    passwordHash: u.passwordHash,
    role: u.role,
    brokerStatus: u.brokerStatus,
    accountStatus: u.accountStatus,
    emailVerifiedAt: u.emailVerifiedAt,
    emailVerificationToken: u.emailVerificationToken,
    emailVerificationExpires: u.emailVerificationExpires,
    name: u.name,
    phone: u.phone,
    referralCode: u.referralCode,
    plan: u.plan,
    stripeAccountId: u.stripeAccountId,
    stripeOnboardingComplete: u.stripeOnboardingComplete,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    isRetargetCandidate: u.isRetargetCandidate,
    investmentMvpAnalyzeCount: u.investmentMvpAnalyzeCount,
    investmentMvpFirstAnalyzeAt: u.investmentMvpFirstAnalyzeAt,
  };
}

/**
 * Wipes the staging database (except backed-up users), restores admin/demo rows, then re-runs the main seed.
 * **Never** call outside `NEXT_PUBLIC_ENV=staging`.
 */
export async function resetDemoDatabase(): Promise<void> {
  assertStagingOnly();

  const emails = keepEmailList();
  const backup = await prisma.user.findMany({
    where: {
      OR: [{ role: "ADMIN" }, { email: { in: emails } }],
    },
  });

  await truncateAllPublicTables();

  for (const u of backup) {
    await prisma.user.create({ data: toCreateData(u) });
  }

  await runSeed();
  console.log("Demo DB reset completed");
}
