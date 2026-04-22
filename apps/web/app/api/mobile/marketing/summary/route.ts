import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { getMarketingMobileSummary } from "@/modules/marketing/marketing-dashboard.service";

export const dynamic = "force-dynamic";

/** GET /api/mobile/marketing/summary — broker + admin */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN && auth.role !== PlatformRole.BROKER) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const summary = await getMarketingMobileSummary();
    return Response.json(summary);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "summary_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
