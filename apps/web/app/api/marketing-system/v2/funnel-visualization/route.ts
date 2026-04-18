import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import {
  computeFunnelVisualization,
  SOFT_LAUNCH_FUNNEL_FLOW,
} from "@/modules/funnel/funnel-visualization.service";

export const dynamic = "force-dynamic";

/**
 * GET — funnel steps + drop-offs + end/head conversion rate (FUNNEL events only).
 * ?preset=soft_launch or ?preset=ads_landing — ad → landing → CTA → listing → lead → booking.
 */
export async function GET(req: Request) {
  if (!engineFlags.marketingIntelligenceV1) {
    return NextResponse.json({ error: "Marketing intelligence is disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const preset = url.searchParams.get("preset")?.trim();
  const sinceDays = Math.min(365, Math.max(7, Number(url.searchParams.get("days")) || 90));
  const since = new Date(Date.now() - sinceDays * 86400000);

  const flow =
    preset === "soft_launch" || preset === "ads_landing"
      ? [...SOFT_LAUNCH_FUNNEL_FLOW]
      : ["ad_click", "blog_view", "listing_view", "lead_capture", "booking_completed"];

  const viz = await computeFunnelVisualization(auth.userId, since, flow);

  return NextResponse.json({
    windowDays: sinceDays,
    preset: preset ?? "default",
    ...viz,
  });
}
