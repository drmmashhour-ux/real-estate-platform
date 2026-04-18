import { NextResponse } from "next/server";
import { softLaunchFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { buildFirstUsersAcquisitionPack } from "@/modules/launch/first-users.service";

export const dynamic = "force-dynamic";

/** GET — segmented first-100 playbook (templates + quotas; not automated outreach). */
export async function GET(req: Request) {
  if (!softLaunchFlags.firstUsersV1) {
    return NextResponse.json({ error: "First users engine is disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const city = url.searchParams.get("city")?.trim() || "Montréal";

  return NextResponse.json(buildFirstUsersAcquisitionPack(city));
}
