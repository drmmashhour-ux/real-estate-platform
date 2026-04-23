/**
 * POST — cron: evaluate held payouts (secret header). Placeholder release logic.
 */

import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { evaluatePayoutEligibility, releasePayout } from "@/modules/bnhub-payments/services/payoutControlService";
import { BnhubMpPayoutStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.BNHUB_MARKETPLACE_CRON_SECRET?.trim();
  const header = req.headers.get("x-bnhub-marketplace-cron")?.trim();
  if (!secret || header !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const held = await prisma.bnhubHostPayoutRecord.findMany({
    where: { payoutStatus: BnhubMpPayoutStatus.HELD },
    take: 200,
    orderBy: { eligibleReleaseAt: "asc" },
  });

  const results: { payoutId: string; action: string }[] = [];
  for (const p of held) {
    const { canRelease, reasons } = await evaluatePayoutEligibility(p.id);
    if (canRelease) {
      await releasePayout(p.id, "eligible_release_window_passed");
      results.push({ payoutId: p.id, action: "marked_scheduled" });
    } else {
      results.push({ payoutId: p.id, action: `still_held:${reasons.join(",")}` });
    }
  }

  return Response.json({ scanned: held.length, results });
}
