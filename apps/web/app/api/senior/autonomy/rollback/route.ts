import { NextResponse } from "next/server";
import { rollbackPricingFromLog } from "@/modules/senior-living/autonomy/senior-autonomous.service";
import { canPricing, seniorCommandAuth } from "@/lib/senior-command/api-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  if (!canPricing(auth.ctx)) {
    return NextResponse.json({ error: "Rollback requires admin" }, { status: 403 });
  }

  let body: { logId?: string };
  try {
    body = (await req.json()) as { logId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const logId = typeof body.logId === "string" ? body.logId.trim() : "";
  if (!logId) return NextResponse.json({ error: "logId required" }, { status: 400 });

  try {
    await rollbackPricingFromLog(logId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "rollback_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
