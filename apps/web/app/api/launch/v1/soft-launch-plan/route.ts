import { NextResponse } from "next/server";
import { softLaunchFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { generateSoftLaunchPlan } from "@/modules/launch/soft-launch-engine.service";

export const dynamic = "force-dynamic";

/** GET — soft launch strategy (planning only; no spend). */
export async function GET(req: Request) {
  if (!softLaunchFlags.softLaunchV1) {
    return NextResponse.json({ error: "Soft launch engine is disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const city = url.searchParams.get("city")?.trim() || "Montréal";

  return NextResponse.json(generateSoftLaunchPlan(city));
}
