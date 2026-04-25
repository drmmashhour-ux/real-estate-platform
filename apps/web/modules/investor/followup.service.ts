import { AccountStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FUNDRAISING_EXECUTION } from "@/modules/investor/fundraising-execution.config";

const MS_PER_DAY = 86400000;

export type FollowUpDueInvestor = {
  id: string;
  name: string;
  email: string;
  firm: string;
  stage: string;
  nextFollowUpAt: string | null;
  reason: "scheduled_overdue" | "stale_touch";
  lastInteractionAt: string | null;
  suggestedNote: string;
};

/**
 * Suggested `nextFollowUpAt` = now + default follow-up days (middle of 3–5d window from playbook).
 */
export function defaultNextFollowUpDate(now = new Date()): Date {
  const d = FUNDRAISING_EXECUTION.followUp.defaultDays;
  return new Date(now.getTime() + d * MS_PER_DAY);
}

/**
 * Investors due for a follow-up:
 * - `nextFollowUpAt` in the past (or today), or
 * - no overdue schedule but last interaction older than `staleAfterDays` (default 3), stage not `closed`.
 */
export async function listInvestorsDueForFollowUp(
  now = new Date(),
  opts?: { staleAfterDays?: number },
): Promise<FollowUpDueInvestor[]> {
  const staleDays = opts?.staleAfterDays ?? FUNDRAISING_EXECUTION.followUp.daysAfterTouchMin;
  const staleCutoff = new Date(now.getTime() - staleDays * MS_PER_DAY);

  const [scheduledDue, candidates] = await Promise.all([
    prisma.fundraisingInvestor.findMany({
      where: {
        stage: { not: "closed" },
        nextFollowUpAt: { not: null, lte: now },
      },
      include: {
        interactions: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      },
      orderBy: { nextFollowUpAt: "asc" },
    }),
    prisma.fundraisingInvestor.findMany({
      where: { stage: { not: "closed" } },
      include: {
        interactions: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      },
    }),
  ]);

  const seen = new Set<string>();
  const out: FollowUpDueInvestor[] = [];
  const suggestedNote = FUNDRAISING_EXECUTION.followUp.shareUpdatePrompt;

  function add(
    row: {
      id: string;
      name: string;
      email: string;
      firm: string;
      stage: string;
      nextFollowUpAt: Date | null;
    },
    reason: FollowUpDueInvestor["reason"],
    lastAt: Date | null,
  ) {
    if (seen.has(row.id)) return;
    seen.add(row.id);
    out.push({
      id: row.id,
      name: row.name,
      email: row.email,
      firm: row.firm,
      stage: row.stage,
      nextFollowUpAt: row.nextFollowUpAt ? row.nextFollowUpAt.toISOString() : null,
      reason,
      lastInteractionAt: lastAt ? lastAt.toISOString() : null,
      suggestedNote,
    });
  }

  for (const row of scheduledDue) {
    const lastAt = row.interactions[0]?.createdAt ?? null;
    add(row, "scheduled_overdue", lastAt);
  }

  for (const row of candidates) {
    const lastAt = row.interactions[0]?.createdAt ?? null;
    if (seen.has(row.id)) continue;
    if (row.nextFollowUpAt && row.nextFollowUpAt > now) continue;
    if (!lastAt || lastAt >= staleCutoff) continue;
    add(row, "stale_touch", lastAt);
  }

  return out;
}

export type ExecutionMomentum = {
  brokerAccounts: number;
  disclaimer: string;
};

/**
 * Momentum for investor updates — real platform counts; label as operator metrics in emails.
 */
export async function getExecutionMomentum(): Promise<ExecutionMomentum> {
  const brokerAccounts = await prisma.user.count({
    where: { role: PlatformRole.BROKER, accountStatus: AccountStatus.ACTIVE },
  });
  return {
    brokerAccounts,
    disclaimer:
      "Operator-only counts from the production database. Not audited financials; use for update emails only with that label.",
  };
}
