import { NextResponse } from "next/server";
import { listInvestorNotifications, syncInvestorNotificationsFromMetrics } from "@/modules/notifications/investor";
import { requireInvestorApiSession } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireInvestorApiSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  await syncInvestorNotificationsFromMetrics().catch(() => {});
  const notifications = await listInvestorNotifications(session.userId, 40);
  return NextResponse.json({ notifications });
}
