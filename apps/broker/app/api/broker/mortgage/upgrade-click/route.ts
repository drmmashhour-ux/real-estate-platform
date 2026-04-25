import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getBrokerApiSession } from "@/modules/mortgage/services/broker-dashboard-api";

export const dynamic = "force-dynamic";

/** Track upgrade CTA clicks (pricing, dashboard, etc.). */
export async function POST() {
  const session = await getBrokerApiSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  if (session.isAdmin) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await prisma.mortgageBroker.update({
    where: { id: session.brokerId },
    data: { upgradeClickCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
