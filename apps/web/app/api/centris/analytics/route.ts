import { NextRequest } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getCentrisBrokerDominationSnapshot } from "@/modules/centris-conversion/centris-funnel-analytics.service";

export const dynamic = "force-dynamic";

/** GET — funnel analytics + top listings for authenticated broker/admin. */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return Response.json({ error: "Broker access only" }, { status: 403 });
  }

  const days = Math.min(90, Math.max(1, parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10) || 30));

  const snapshot = await getCentrisBrokerDominationSnapshot(userId, days);

  return Response.json(snapshot);
}
