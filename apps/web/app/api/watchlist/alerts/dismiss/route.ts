import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { dismissAlert } from "@/src/modules/watchlist-alerts/application/dismissAlert";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const alertId = typeof body?.alertId === "string" ? body.alertId : "";
  if (!alertId) return NextResponse.json({ error: "alertId required" }, { status: 400 });
  return NextResponse.json(await dismissAlert({ userId, alertId }));
}
