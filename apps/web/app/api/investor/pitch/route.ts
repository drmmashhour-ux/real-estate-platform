import { launchSystemV1Flags, lecipmLaunchInvestorFlags } from "@/config/feature-flags";
import { requirePlatformLaunchInvestor } from "@/lib/launch-investor-api-auth";
import { buildFullInvestorPitchPackage } from "@/modules/investor-pitch/pitch.service";
import { trackInvestorPitchViewed } from "@/lib/analytics/launch-analytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/investor/pitch — investor deck JSON (platform executive only).
 * Distinct from investor-portal routes under `/api/investor/*` (session-scoped).
 */
export async function GET() {
  const auth = await requirePlatformLaunchInvestor();
  if (!auth.ok) return auth.response;
  if (!launchSystemV1Flags.investorPitchDeckV1 || !lecipmLaunchInvestorFlags.investorMetricsV1) {
    return Response.json({ error: "Investor pitch module or metrics disabled" }, { status: 403 });
  }

  const pkg = await buildFullInvestorPitchPackage();
  trackInvestorPitchViewed({ slides: pkg.deck.slides.length });
  return Response.json({
    ok: true,
    generatedAt: pkg.generatedAt,
    deck: pkg.deck,
    narrative: pkg.narrative,
  });
}
