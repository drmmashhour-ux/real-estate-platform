import { prisma } from "@/lib/db";
import { calculateVestedShares } from "./vesting";
import { syncHolderEquityPercents } from "./capTable";

export type CreateGrantInput = {
  holderId: string;
  totalShares: number;
  vestingStart: Date;
  vestingDuration: number;
  cliffMonths: number;
};

export async function createGrant(input: CreateGrantInput) {
  if (!Number.isFinite(input.totalShares) || input.totalShares <= 0) {
    throw new Error("totalShares must be positive");
  }
  if (input.vestingDuration < 0 || input.cliffMonths < 0) {
    throw new Error("vesting durations must be non-negative");
  }

  const vested = calculateVestedShares(
    {
      totalShares: input.totalShares,
      vestingStart: input.vestingStart,
      vestingDurationMonths: input.vestingDuration,
      cliffMonths: input.cliffMonths,
    },
    new Date()
  );

  const grant = await prisma.equityGrant.create({
    data: {
      holderId: input.holderId,
      totalShares: input.totalShares,
      vestingStart: input.vestingStart,
      vestingDuration: input.vestingDuration,
      cliffMonths: input.cliffMonths,
      vestedShares: vested,
    },
  });

  await syncHolderEquityPercents();
  return grant;
}

export type UpdateGrantInput = Partial<{
  totalShares: number;
  vestingStart: Date;
  vestingDuration: number;
  cliffMonths: number;
}>;

export async function updateGrant(grantId: string, patch: UpdateGrantInput) {
  const current = await prisma.equityGrant.findUniqueOrThrow({ where: { id: grantId } });

  const next = {
    totalShares: patch.totalShares ?? current.totalShares,
    vestingStart: patch.vestingStart ?? current.vestingStart,
    vestingDuration: patch.vestingDuration ?? current.vestingDuration,
    cliffMonths: patch.cliffMonths ?? current.cliffMonths,
  };

  if (next.totalShares <= 0) throw new Error("totalShares must be positive");

  const vested = calculateVestedShares(
    {
      totalShares: next.totalShares,
      vestingStart: next.vestingStart,
      vestingDurationMonths: next.vestingDuration,
      cliffMonths: next.cliffMonths,
    },
    new Date()
  );

  const grant = await prisma.equityGrant.update({
    where: { id: grantId },
    data: {
      totalShares: next.totalShares,
      vestingStart: next.vestingStart,
      vestingDuration: next.vestingDuration,
      cliffMonths: next.cliffMonths,
      vestedShares: vested,
    },
  });

  await syncHolderEquityPercents();
  return grant;
}

/** Recompute `vestedShares` from schedule as-of `asOf` (default now). */
export async function calculateVesting(grantId: string, asOf: Date = new Date()) {
  const g = await prisma.equityGrant.findUniqueOrThrow({ where: { id: grantId } });
  const vested = calculateVestedShares(
    {
      totalShares: g.totalShares,
      vestingStart: g.vestingStart,
      vestingDurationMonths: g.vestingDuration,
      cliffMonths: g.cliffMonths,
    },
    asOf
  );

  const updated = await prisma.equityGrant.update({
    where: { id: grantId },
    data: { vestedShares: vested },
  });
  await syncHolderEquityPercents();
  return updated;
}

export async function recalculateAllVesting(asOf: Date = new Date()) {
  const grants = await prisma.equityGrant.findMany();
  for (const g of grants) {
    const vested = calculateVestedShares(
      {
        totalShares: g.totalShares,
        vestingStart: g.vestingStart,
        vestingDurationMonths: g.vestingDuration,
        cliffMonths: g.cliffMonths,
      },
      asOf
    );
    await prisma.equityGrant.update({
      where: { id: g.id },
      data: { vestedShares: vested },
    });
  }
  await syncHolderEquityPercents();
  return { count: grants.length };
}
