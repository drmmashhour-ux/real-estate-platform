import { NextResponse } from "next/server";
import { approveContentItem } from "@/src/modules/growth-automation/application/approveContentItem";
import { requireGrowthAutomationAdmin } from "@/src/modules/growth-automation/infrastructure/growthApiAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;
  const body = await req.json().catch(() => ({}));
  const itemId = typeof body.itemId === "string" ? body.itemId : "";
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  try {
    const row = await approveContentItem(itemId);
    return NextResponse.json({ item: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Approve failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
