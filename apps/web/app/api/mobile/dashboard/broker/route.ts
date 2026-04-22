import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { getBrokerDashboardData } from "@/modules/dashboard/services/broker-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.BROKER && auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const data = await getBrokerDashboardData(auth.id);
  return Response.json(data);
}
