import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { verifyCronBearer } from "@/lib/server/internal-cron-auth";
import { createRevenueSnapshotsForHost } from "@/modules/bnhub-revenue/bnhub-revenue-snapshot.service";

export const dynamic = "force-dynamic";

/**
 * POST — alias of `/api/bnhub/revenue/snapshots`.
 * Persists `BnhubRevenueMetricSnapshot` for listing + portfolio scopes (deterministic KPIs).
 */
export async function POST(req: NextRequest) {
  const cronOk = verifyCronBearer(req);

  let targetUserId: string | null = null;

  try {
    const json = (await req.json()) as { userId?: string };
    if (typeof json?.userId === "string" && json.userId.trim()) {
      targetUserId = json.userId.trim();
    }
  } catch {
    targetUserId = null;
  }

  if (cronOk) {
    if (!targetUserId) {
      return NextResponse.json({ error: "userId required when using cron authentication" }, { status: 400 });
    }
    await createRevenueSnapshotsForHost(targetUserId);
    return NextResponse.json({ success: true });
  }

  const sessionUser = await getGuestId();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await createRevenueSnapshotsForHost(sessionUser);
  return NextResponse.json({ success: true });
}
