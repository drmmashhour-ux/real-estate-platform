import { NextRequest } from "next/server";
import { cronNotConfigured, cronUnauthorized, verifyCronBearer } from "@/lib/server/internal-cron-auth";
import { getMarketIntelligenceSnapshot } from "@/src/modules/market/market-intelligence.service";
import { marketplaceAiV5Flags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/marketplace-ai-v5/run — lightweight batch (cron). No user-facing side effects.
 */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  void request;

  const intel = await getMarketIntelligenceSnapshot(15);

  return Response.json({
    ok: true,
    flags: marketplaceAiV5Flags,
    marketIntelligence: intel,
  });
}
