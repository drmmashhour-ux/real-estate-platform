import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { buildMobileRevenueTeamSummary } from "@/modules/revenue-predictor/revenue-predictor.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getMobileAuthUser(_request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const teamId = decodeURIComponent(id);

  try {
    const summary = buildMobileRevenueTeamSummary(teamId);
    if (!summary) return Response.json({ error: "Team not found" }, { status: 404 });
    return Response.json(summary);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "team_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
