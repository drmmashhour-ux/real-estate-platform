import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildCapitalAllocationPlan } from "@/modules/growth/capital-allocation.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!engineFlags.capitalAllocationV1) {
    return NextResponse.json({ error: "Capital allocation engine disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const windowDays = Math.min(30, Math.max(7, Number(url.searchParams.get("windowDays")) || 14));

  const plan = await buildCapitalAllocationPlan(windowDays);

  return NextResponse.json({
    plan,
    disclaimer:
      "Advisory prioritization only — compares logged growth signals; does not move money, trigger billing, or automate ad spend.",
  });
}
