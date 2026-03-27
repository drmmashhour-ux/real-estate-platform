import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { generateDailyContentPlan } from "@/src/modules/ai-growth-engine/application/generateDailyContentPlan";
import { persistGeneratedPlan } from "@/src/modules/ai-growth-engine/application/persistGeneratedPlan";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const planDate = typeof body.planDate === "string" ? body.planDate : new Date().toISOString().slice(0, 10);
  const focus = typeof body.focus === "string" ? body.focus : undefined;
  const persist = Boolean(body.persist);

  const plan = await generateDailyContentPlan({ planDate, focus });

  if (!persist) {
    return NextResponse.json({ plan });
  }

  try {
    const { planRow, items } = await persistGeneratedPlan(plan);
    return NextResponse.json({ plan, savedPlanId: planRow.id, items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Persist failed";
    return NextResponse.json({ error: msg, plan }, { status: 500 });
  }
}
