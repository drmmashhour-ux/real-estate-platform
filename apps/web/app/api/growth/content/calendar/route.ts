import { NextResponse } from "next/server";
import {
  listContentItemsForCalendar,
  listRecentContentItems,
} from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";
import { requireGrowthAutomationAdmin } from "@/src/modules/growth-automation/infrastructure/growthApiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  if (fromStr && toStr) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json({ error: "Invalid from/to" }, { status: 400 });
    }
    const items = await listContentItemsForCalendar(from, to);
    return NextResponse.json({ items });
  }

  const items = await listRecentContentItems(80);
  return NextResponse.json({ items });
}
