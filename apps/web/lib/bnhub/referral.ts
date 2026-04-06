import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

export function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

/** Get or create the default referral program (for host referrals). */
export async function getOrCreateDefaultReferralProgram() {
  let program = await prisma.referralProgram.findFirst({
    where: { active: true },
  });
  if (!program) {
    program = await prisma.referralProgram.create({
      data: {
        name: "Host Referral",
        rewardCreditsReferrer: 500,
        rewardCreditsReferee: 500,
        active: true,
      },
    });
  }
  return program;
}

export async function createReferral(
  referrerId: string,
  rewardCreditsCents = 500,
  programId?: string | null
) {
  const program = programId
    ? await prisma.referralProgram.findUnique({ where: { id: programId } })
    : await getOrCreateDefaultReferralProgram();
  const credits = program ? program.rewardCreditsReferrer : rewardCreditsCents;

  let code = generateReferralCode();
  let existing = await prisma.referral.findUnique({ where: { code } });
  while (existing) {
    code = generateReferralCode();
    existing = await prisma.referral.findUnique({ where: { code } });
  }
  return prisma.referral.create({
    data: {
      referrerId,
      code,
      rewardCreditsCents: credits,
      programId: program?.id ?? undefined,
      status: "invited",
      rewardGiven: false,
    },
  });
}

export async function useReferralCode(code: string, usedByUserId: string) {
  const ref = await prisma.referral.findUnique({
    where: { code },
  });
  if (!ref) throw new Error("Invalid referral code");
  if (ref.usedByUserId) throw new Error("Referral code already used");
  if (ref.referrerId === usedByUserId) throw new Error("Cannot use your own code");
  return prisma.referral.update({
    where: { id: ref.id },
    data: { usedByUserId, usedAt: new Date(), status: "joined" },
  });
}

export async function getReferralsByUser(referrerId: string) {
  return prisma.referral.findMany({
    where: { referrerId },
    orderBy: { createdAt: "desc" },
  });
}
