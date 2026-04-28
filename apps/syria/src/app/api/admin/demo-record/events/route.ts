import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { demoRecorderSnapshot } from "@/lib/demo/demo-recorder-store";
import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  if (!isInvestorDemoModeActive()) {
    return NextResponse.json({ ok: false, message: "Investor demo mode is not active" }, { status: 403 });
  }

  const u = new URL(req.url);
  const sid = u.searchParams.get("sessionId")?.trim().slice(0, 128) || "default";

  const events = demoRecorderSnapshot(sid);
  return NextResponse.json({ ok: true, events, sessionId: sid });
}
