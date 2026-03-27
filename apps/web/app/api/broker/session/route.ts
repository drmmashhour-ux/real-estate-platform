import { NextResponse } from "next/server";
import { getMortgageBrokerSessionForUi } from "@/modules/mortgage/services/broker-dashboard-api";

export const dynamic = "force-dynamic";

/** Broker plan + verification flags for pricing UI and dashboard header (no lead list). */
export async function GET() {
  const session = await getMortgageBrokerSessionForUi();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  if (session.isAdmin) {
    return NextResponse.json({ isAdmin: true, plan: "admin" as const });
  }
  return NextResponse.json({
    isAdmin: false,
    plan: session.plan,
    brokerId: session.brokerId,
    isVerified: session.isVerified,
    verificationStatus: session.verificationStatus,
    identityStatus: session.identityStatus,
    identityVerified: session.identityVerified,
    fullName: session.fullName,
    name: session.name,
    profileCompletedAt: session.profileCompletedAt,
  });
}
