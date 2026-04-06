import { prisma } from "@/lib/db";
import {
  isFundraisingRoundStatus,
  isInvestorCommitmentStatus,
  type FundraisingRoundStatus,
  type InvestorCommitmentStatus,
} from "./constants";
import { computeRaisedFromCommitments } from "./roundMetrics";

const DEFAULT_100K_TARGET = 100_000;

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

/** Ensures an open $100K round exists and returns it with fresh raised total. */
export async function getOrCreateOpen100kRound() {
  let round = await prisma.fundraisingRound.findFirst({
    where: { targetAmount: DEFAULT_100K_TARGET, status: "open" },
    orderBy: { createdAt: "desc" },
  });
  if (!round) {
    round = await prisma.fundraisingRound.create({
      data: {
        targetAmount: DEFAULT_100K_TARGET,
        raisedAmount: 0,
        status: "open",
      },
    });
  } else {
    await syncRoundRaisedAmount(round.id);
    round = await prisma.fundraisingRound.findUniqueOrThrow({ where: { id: round.id } });
  }
  return round;
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
