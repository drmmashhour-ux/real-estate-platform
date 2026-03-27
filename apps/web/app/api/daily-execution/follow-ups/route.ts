import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { generateFollowUpMessage } from "@/src/modules/daily-execution/domain/outreachCopy";
import { listFollowUpQueue } from "@/src/modules/daily-execution/application/dailyMetricsService";

export const dynamic = "force-dynamic";

/** GET — leads you introduced, last touch 24h+ ago, no reply/demo stage (copy-only assist). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leads = await listFollowUpQueue(prisma, userId);
  return NextResponse.json({
    messageTemplate: generateFollowUpMessage(),
    leads,
  });
}
