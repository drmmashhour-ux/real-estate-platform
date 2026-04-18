import { NextResponse } from "next/server";
import { softLaunchFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { optimizeLandingExperience } from "@/modules/launch/landing-optimizer.service";

export const dynamic = "force-dynamic";

/** GET — explainable landing recommendations (no page mutation). */
export async function GET(req: Request) {
  if (!softLaunchFlags.softLaunchV1) {
    return NextResponse.json({ error: "Soft launch is disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const city = url.searchParams.get("city")?.trim() || "Montréal";
  const audience = url.searchParams.get("audience")?.trim() || "buyer";

  return NextResponse.json(optimizeLandingExperience({ city, audience }));
}
