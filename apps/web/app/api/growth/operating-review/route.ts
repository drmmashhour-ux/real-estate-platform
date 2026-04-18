import { NextResponse } from "next/server";
import { growthOperatingReviewFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildGrowthOperatingReviewSummary } from "@/modules/growth/growth-operating-review.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthOperatingReviewFlags.growthOperatingReviewV1) {
    return NextResponse.json({ error: "Growth operating review layer disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const summary = await buildGrowthOperatingReviewSummary();
  if (!summary) {
    return NextResponse.json({ error: "Operating review unavailable" }, { status: 503 });
  }

  return NextResponse.json({ summary });
}
