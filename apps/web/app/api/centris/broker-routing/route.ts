import { NextRequest } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { brokerCanAccessCentrisLead } from "@/modules/centris-conversion/centris-access.guard";
import { resolveCentrisBrokerRouting } from "@/modules/centris-conversion/centris-broker-routing.service";

export const dynamic = "force-dynamic";

/** GET ?leadId= — explain broker routing resolution for this Centris lead. */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const leadId = req.nextUrl.searchParams.get("leadId")?.trim();
  if (!leadId) return Response.json({ error: "leadId required" }, { status: 400 });

  const ok = await brokerCanAccessCentrisLead(userId, user?.role, leadId);
  if (!ok) return Response.json({ error: "Forbidden" }, { status: 403 });

  const routing = await resolveCentrisBrokerRouting(leadId);

  return Response.json({ routing });
}
