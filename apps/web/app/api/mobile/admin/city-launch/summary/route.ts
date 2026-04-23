import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { buildCityLaunchMobileSummaryList } from "@/modules/city-launch/city-launch-mobile.service";

export const dynamic = "force-dynamic";

/** GET — per-territory playbook snapshot for mobile admin launcher. */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return Response.json(buildCityLaunchMobileSummaryList());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "city_launch_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
