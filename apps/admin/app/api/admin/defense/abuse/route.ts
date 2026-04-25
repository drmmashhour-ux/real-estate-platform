import { NextRequest } from "next/server";
import { recordAbuseSignal, getAbuseSignals, getOffenderProfile } from "@/lib/defense/abuse-prevention";
import type { AbuseSignalType } from "@prisma/client";

export const dynamic = "force-dynamic";

const SIGNAL_TYPES: AbuseSignalType[] = [
  "REPEAT_OFFENDER", "LINKED_ACCOUNT", "EVASION_AFTER_SUSPENSION", "ABUSIVE_MESSAGING",
  "ABUSIVE_BOOKING", "REFUND_ABUSE", "PROMOTION_ABUSE", "REFERRAL_ABUSE", "BAN_EVASION",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (userId && searchParams.get("profile") === "true") {
      const profile = await getOffenderProfile(userId);
      return Response.json(profile ?? { message: "No profile" });
    }
    const signals = await getAbuseSignals({
      userId: userId ?? undefined,
      entityType: searchParams.get("entityType") ?? undefined,
      entityId: searchParams.get("entityId") ?? undefined,
      signalType: searchParams.get("signalType") as AbuseSignalType | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50,
    });
    return Response.json(signals);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get abuse data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, entityType, entityId, signalType, severity, payload, createdBy } = body;
    if (!signalType || !SIGNAL_TYPES.includes(signalType) || !severity) {
      return Response.json(
        { error: "signalType (valid enum), severity required" },
        { status: 400 }
      );
    }
    const signal = await recordAbuseSignal({
      userId,
      entityType,
      entityId,
      signalType,
      severity,
      payload,
      createdBy,
    });
    return Response.json(signal);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to record abuse signal" }, { status: 500 });
  }
}
