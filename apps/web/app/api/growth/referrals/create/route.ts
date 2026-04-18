import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateReferralCodeCandidate } from "@/modules/referrals";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  for (let i = 0; i < 5; i++) {
    const code = generateReferralCodeCandidate();
    try {
      const row = await prisma.referral.create({
        data: {
          referrerId: auth.userId,
          code,
        },
      });
      return NextResponse.json({ id: row.id, code: row.code });
    } catch {
      /* code collision — retry */
    }
  }
  return NextResponse.json({ error: "Could not allocate referral code" }, { status: 500 });
}
