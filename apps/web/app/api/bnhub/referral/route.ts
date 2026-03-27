import { NextRequest } from "next/server";
import { createReferral, useReferralCode, getReferralsByUser } from "@/lib/bnhub/referral";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referrerId = searchParams.get("referrerId");
    if (!referrerId) {
      return Response.json({ error: "referrerId required" }, { status: 400 });
    }
    const referrals = await getReferralsByUser(referrerId);
    return Response.json(referrals);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const referrerId = body?.referrerId;
    const rewardCreditsCents = body?.rewardCreditsCents ?? 500;
    if (!referrerId) {
      return Response.json({ error: "referrerId required" }, { status: 400 });
    }
    const referral = await createReferral(referrerId, rewardCreditsCents);
    return Response.json(referral);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
