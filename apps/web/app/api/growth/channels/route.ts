import { NextResponse } from "next/server";
import { getConnectedChannels } from "@/src/modules/growth-automation/application/getConnectedChannels";
import { requireGrowthAutomationAdmin } from "@/src/modules/growth-automation/infrastructure/growthApiAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;
  const channels = await getConnectedChannels();
  return NextResponse.json({ channels });
}
