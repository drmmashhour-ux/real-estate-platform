import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { getAcquisitionSummaryMobileVm } from "@/modules/acquisition/acquisition-tracking.service";

export const dynamic = "force-dynamic";

/** Internal launch metrics — admin-only. */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const summary = await getAcquisitionSummaryMobileVm();
    return Response.json(summary);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "summary_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
