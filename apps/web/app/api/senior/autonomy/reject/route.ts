import { NextResponse } from "next/server";
import { rejectAutonomousAction } from "@/modules/senior-living/autonomy/senior-autonomous.service";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;

  let body: { logId?: string; reason?: string };
  try {
    body = (await req.json()) as { logId?: string; reason?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const logId = typeof body.logId === "string" ? body.logId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!logId) return NextResponse.json({ error: "logId required" }, { status: 400 });
  if (!reason) return NextResponse.json({ error: "reason required" }, { status: 400 });

  await rejectAutonomousAction(logId, auth.ctx.userId, reason);
  return NextResponse.json({ ok: true });
}
