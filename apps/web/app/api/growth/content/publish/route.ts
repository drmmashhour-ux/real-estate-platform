import { NextResponse } from "next/server";
import { publishApprovedContent } from "@/src/modules/growth-automation/application/publishApprovedContent";
import { retryFailedPublication } from "@/src/modules/growth-automation/application/retryFailedPublication";
import { requireGrowthAutomationAdmin } from "@/src/modules/growth-automation/infrastructure/growthApiAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;
  const body = await req.json().catch(() => ({}));
  const itemId = typeof body.itemId === "string" ? body.itemId : "";
  const retry = Boolean(body.retry);
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  try {
    const result = retry ? await retryFailedPublication(itemId) : await publishApprovedContent(itemId);
    if (result && typeof result === "object" && "ok" in result && result.ok === false) {
      return NextResponse.json({ error: result.message, code: result.code }, { status: 502 });
    }
    return NextResponse.json({ result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Publish failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
