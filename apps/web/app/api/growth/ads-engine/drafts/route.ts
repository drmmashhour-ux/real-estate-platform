import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { generateAdDrafts } from "@/modules/growth/ads-engine.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  if (!engineFlags.adsEngineV1) {
    return NextResponse.json({ error: "Ads engine is disabled" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim() || "[CITY]";
  const drafts = generateAdDrafts(city);
  return NextResponse.json({ city, drafts });
}
