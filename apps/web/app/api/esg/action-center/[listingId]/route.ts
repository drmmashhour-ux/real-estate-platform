import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  buildInvestorActionCenterAppendix,
  formatActionCenterForInvestorHtml,
  getEsgActionCenterBundle,
  userCanAccessEsgActionCenter,
} from "@/modules/esg/esg-action-center.service";
import {
  buildInvestorRetrofitAppendix,
  formatRetrofitForInvestorHtml,
} from "@/modules/esg/esg-retrofit-planner.service";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TAG = "[esg-action-center]";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ listingId: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await context.params;
  if (!listingId?.trim()) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const ok = await userCanAccessEsgActionCenter(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const bundle = await getEsgActionCenterBundle(listingId);
    const investorAppendix = await buildInvestorActionCenterAppendix(listingId);
    const retrofitInvestorAppendix = await buildInvestorRetrofitAppendix(listingId);
    const investorReportHtmlFragment =
      formatActionCenterForInvestorHtml(investorAppendix) +
      (retrofitInvestorAppendix ? `\n${formatRetrofitForInvestorHtml(retrofitInvestorAppendix)}` : "");

    logInfo(`${TAG} get`, { listingId });
    return NextResponse.json({
      ...bundle,
      investorAppendix,
      retrofitInvestorAppendix,
      investorReportHtmlFragment,
      actionCenterSummary: {
        topActions: investorAppendix.topActions,
        quickWins: investorAppendix.quickWins,
        majorBlockers: investorAppendix.majorBlockers,
        estimatedReadinessImprovement: investorAppendix.estimatedReadinessImprovement,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to load action center" }, { status: 500 });
  }
}
