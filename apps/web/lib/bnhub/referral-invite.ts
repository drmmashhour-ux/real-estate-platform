import { prisma } from "@/lib/db";
import { createReferral } from "./referral";

async function ensureProgram(
  name: string,
  rewardReferrerCents: number,
  rewardRefereeCents: number
) {
  let program = await prisma.referralProgram.findFirst({ where: { name } });
  if (!program) {
    program = await prisma.referralProgram.create({
      data: {
        name,
        rewardCreditsReferrer: rewardReferrerCents,
        rewardCreditsReferee: rewardRefereeCents,
        active: true,
      },
    });
  }
  return program;
}

/** Invite another host — referrer earns credits when code is used; referee gets onboarding discount pool. */
export async function inviteHost(referrerId: string) {
  const program = await ensureProgram("BNHub Host Invite", 1500, 1000);
  return createReferral(referrerId, program.rewardCreditsReferrer, program.id);
}

/** Invite a guest — smaller credit pool, still stackable with platform promos. */
export async function inviteGuest(referrerId: string) {
  const program = await ensureProgram("BNHub Guest Invite", 800, 800);
  return createReferral(referrerId, program.rewardCreditsReferrer, program.id);
}
