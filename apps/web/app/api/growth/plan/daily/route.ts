import { NextResponse } from "next/server";
import { generateDailyContentPlan } from "@/src/modules/growth-automation/application/generateDailyContentPlan";
import { requireGrowthAutomationAdmin } from "@/src/modules/growth-automation/infrastructure/growthApiAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;
  const body = await req.json().catch(() => ({}));
  const planDate = typeof body.planDate === "string" ? body.planDate : new Date().toISOString().slice(0, 10);
  const focus = typeof body.focus === "string" ? body.focus : undefined;
  const plan = await generateDailyContentPlan({ planDate, focus });
  return NextResponse.json({ plan });
}
