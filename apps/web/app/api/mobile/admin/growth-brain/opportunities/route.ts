import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { buildGrowthBrainMobilePayload } from "@/modules/growth-brain/growth-brain.service";

export const dynamic = "force-dynamic";

/** GET `/api/mobile/admin/growth-brain/opportunities` */
export async function GET() {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = buildGrowthBrainMobilePayload();
    return Response.json({
      generatedAt: payload.generatedAtIso,
      items: payload.opportunities.map((o) => ({
        id: o.id,
        title: o.title,
        domain: o.domain,
        priorityScore: o.priorityScore,
        expectedImpact: o.expectedImpact,
        region: o.region ?? null,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "opportunities_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
