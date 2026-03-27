import { NextResponse } from "next/server";
import { scheduleContent } from "@/src/modules/growth-automation/application/scheduleContent";
import { requireGrowthAutomationAdmin } from "@/src/modules/growth-automation/infrastructure/growthApiAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;
  const body = await req.json().catch(() => ({}));
  const itemId = typeof body.itemId === "string" ? body.itemId : "";
  const scheduledFor = typeof body.scheduledFor === "string" ? body.scheduledFor : "";
  if (!itemId || !scheduledFor) {
    return NextResponse.json({ error: "itemId and scheduledFor (ISO) required" }, { status: 400 });
  }
  try {
    const row = await scheduleContent({ itemId, scheduledFor });
    return NextResponse.json({ item: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Schedule failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
