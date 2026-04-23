import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { buildCityLaunchFullView } from "@/modules/city-launch/city-launch.service";

export const dynamic = "force-dynamic";

/** GET — full playbook + progress for one territory (mobile admin). */
export async function GET(request: Request, ctx: { params: Promise<{ territoryId: string }> }) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { territoryId } = await ctx.params;
  const id = decodeURIComponent(territoryId);

  try {
    const view = buildCityLaunchFullView(id);
    if (!view) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json(view);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "city_launch_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
