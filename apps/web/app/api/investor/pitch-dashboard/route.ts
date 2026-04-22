import { getInvestorPitchDashboardVm } from "@/modules/investor/investor-pitch-data.service";
import { canViewLiveInvestorPitchDashboard } from "@/modules/investor/investor-pitch-access";

export const dynamic = "force-dynamic";

/**
 * GET /api/investor/pitch-dashboard
 * - ?sample=1 → illustrative metrics (always allowed).
 * - Platform executives → live metrics unless ?sample=1.
 * - Others → sample-equivalent payload (safe for demos).
 */
export async function GET(req: Request) {
  const sampleParam = new URL(req.url).searchParams.get("sample") === "1";
  const allowLive = await canViewLiveInvestorPitchDashboard();

  const sampleMode = sampleParam || !allowLive;
  const vm = await getInvestorPitchDashboardVm({ sampleMode });

  return Response.json(vm);
}
