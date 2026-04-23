import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { analyzeAlert } from "@/lib/alerts/analyze";
import { AlertAnalysisSafetyError } from "@/lib/alerts/safety";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const alertId = typeof (body as { alertId?: string })?.alertId === "string" ? (body as { alertId: string }).alertId : "";
  if (!alertId) return NextResponse.json({ error: "alertId required" }, { status: 400 });

  const owned = await prisma.watchlistAlert.findFirst({
    where: { id: alertId, userId },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const item = await analyzeAlert(alertId, { actorUserId: userId });
    return NextResponse.json({ success: true, item });
  } catch (e) {
    if (e instanceof AlertAnalysisSafetyError) {
      return NextResponse.json({ success: false, error: e.code }, { status: 422 });
    }
    const msg = e instanceof Error ? e.message : "Analyze failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
