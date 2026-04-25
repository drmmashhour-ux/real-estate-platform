import { FUNDRAISING_EXECUTION } from "@/modules/investor/fundraising-execution.config";
import { prisma } from "@/lib/db";
import {
  isFundraisingRoundStatus,
  isInvestorCommitmentStatus,
  type FundraisingRoundStatus,
  type InvestorCommitmentStatus,
} from "./constants";
import { computeRaisedFromCommitments } from "./roundMetrics";

const DEFAULT_100K_TARGET = 100_000;

/** Target CAD for the active execution round; env override must stay within 100k–500k. */
export function resolveExecutionRoundTargetCad(): number {
  const raw = process.env.FUNDRAISING_TARGET_CAD?.trim();
  if (raw && /^\d{5,7}$/.test(raw)) {
    const n = parseInt(raw, 10);
    if (n >= FUNDRAISING_EXECUTION.targetAmountMinCad && n <= FUNDRAISING_EXECUTION.targetAmountMaxCad) {
      return n;
    }
  }
  return FUNDRAISING_EXECUTION.defaultTargetCad;
}

export async function syncRoundRaisedAmount(roundId: string): Promise<number> {
  const rows = await prisma.investorCommitment.findMany({
    where: { roundId },
    select: { amount: true, status: true },
  });
  const raised = computeRaisedFromCommitments(rows);
  await prisma.fundraisingRound.update({
    where: { id: roundId },
    data: { raisedAmount: raised },
  });
  return raised;
}

/** Ensures an open round exists for the given target (e.g. 250_000) with fresh `raisedAmount`. */
export async function getOrCreateOpenRoundForTarget(targetAmount: number) {
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) throw new Error("invalid targetAmount");
  let round = await prisma.fundraisingRound.findFirst({
    where: { targetAmount, status: "open" },
    orderBy: { createdAt: "desc" },
  });
  if (!round) {
    round = await prisma.fundraisingRound.create({
      data: { targetAmount, raisedAmount: 0, status: "open" },
    });
  } else {
    await syncRoundRaisedAmount(round.id);
    round = await prisma.fundraisingRound.findUniqueOrThrow({ where: { id: round.id } });
  }
  return round;
}

/** Default first raise ($100k–$500k) — see `FUNDRAISING_TARGET_CAD` and `fundraising-execution.config`. */
export async function getOrCreateOpenExecutionRound() {
  return getOrCreateOpenRoundForTarget(resolveExecutionRoundTargetCad());
}

/** Ensures the legacy $100K round — tests and existing dashboards pinned to 100k target. */
export async function getOrCreateOpen100kRound() {
  return getOrCreateOpenRoundForTarget(DEFAULT_100K_TARGET);
}

export async function listCommitmentsForRound(roundId: string) {
  return prisma.investorCommitment.findMany({
    where: { roundId },
    orderBy: { createdAt: "desc" },
    include: {
      investor: { select: { id: true, name: true, email: true, firm: true } },
    },
  });
}

export async function createInvestorCommitment(
  roundId: string,
  investorId: string,
  amount: number,
  status: InvestorCommitmentStatus = "interested",
) {
  if (!isInvestorCommitmentStatus(status)) throw new Error(`Invalid commitment status: ${status}`);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("amount must be a non-negative number");

  const row = await prisma.investorCommitment.create({
    data: { roundId, investorId, amount, status },
  });
  await syncRoundRaisedAmount(roundId);
  return row;
}

export async function updateInvestorCommitment(
  commitmentId: string,
  patch: { status?: InvestorCommitmentStatus; amount?: number },
) {
  if (patch.status !== undefined && !isInvestorCommitmentStatus(patch.status)) {
    throw new Error(`Invalid commitment status: ${patch.status}`);
  }
  if (patch.amount !== undefined && (!Number.isFinite(patch.amount) || patch.amount < 0)) {
    throw new Error("amount must be a non-negative number");
  }

  const existing = await prisma.investorCommitment.findUnique({
    where: { id: commitmentId },
    select: { roundId: true },
  });
  if (!existing) throw new Error("commitment not found");

  const row = await prisma.investorCommitment.update({
    where: { id: commitmentId },
    data: {
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
    },
  });
  await syncRoundRaisedAmount(existing.roundId);
  return row;
}

export async function updateRoundStatus(roundId: string, status: FundraisingRoundStatus) {
  if (!isFundraisingRoundStatus(status)) throw new Error(`Invalid round status: ${status}`);
  return prisma.fundraisingRound.update({
    where: { id: roundId },
    data: { status },
  });
}
