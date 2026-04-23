import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getBrokerApiSession } from "@/modules/mortgage/services/broker-dashboard-api";

export const dynamic = "force-dynamic";

/** Mock upgrade to Pro (no payment). Counts as an upgrade action for analytics. */
export async function POST() {
  const session = await getBrokerApiSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  if (session.isAdmin) {
    return NextResponse.json({ error: "Not available for admin session" }, { status: 400 });
  }

  await prisma.mortgageBroker.update({
    where: { id: session.brokerId },
    data: {
      plan: "pro",
      upgradeClickCount: { increment: 1 },
    },
  });

  return NextResponse.json({ ok: true, plan: "pro" });
}
