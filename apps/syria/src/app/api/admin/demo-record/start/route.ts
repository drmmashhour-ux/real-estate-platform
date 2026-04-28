import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { demoRecorderClear } from "@/lib/demo/demo-recorder-store";
import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  if (!isInvestorDemoModeActive()) {
    return NextResponse.json({ ok: false, message: "Investor demo mode is not active" }, { status: 403 });
  }

  let sessionId = "default";
  try {
    const body = (await req.json()) as { sessionId?: string };
    if (typeof body.sessionId === "string" && body.sessionId.trim()) {
      sessionId = body.sessionId.trim().slice(0, 128);
    }
  } catch {
    /* optional body */
  }

  demoRecorderClear(sessionId);
  return NextResponse.json({ ok: true, sessionId });
}
