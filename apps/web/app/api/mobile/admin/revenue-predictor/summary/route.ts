import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { getRevenuePredictorAdminSummary } from "@/modules/revenue-predictor/revenue-predictor.service";

export const dynamic = "force-dynamic";

/** GET — org-level revenue predictor snapshot for mobile admins. */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const summary = getRevenuePredictorAdminSummary();
    return Response.json({
      ...summary,
      disclaimer: "Operational ranges — not GAAP; browser snapshot may be empty until CRM sync.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "revenue_predictor_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
