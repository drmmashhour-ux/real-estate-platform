import { NextRequest } from "next/server";
import { useReferralCode } from "@/lib/bnhub/referral";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = body?.code;
    const usedByUserId = body?.usedByUserId;
    if (!code || !usedByUserId) {
      return Response.json({ error: "code and usedByUserId required" }, { status: 400 });
    }
    const referral = await useReferralCode(code.trim().toUpperCase(), usedByUserId);
    return Response.json(referral);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to use referral code";
    return Response.json({ error: message }, { status: 400 });
  }
}
