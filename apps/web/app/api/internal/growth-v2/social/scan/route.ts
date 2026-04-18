import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { scanSocialContentCandidatesV2 } from "@/src/modules/growth/social/social-candidate.service";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  if (!engineFlags.socialContentAutopilotV2) {
    return Response.json({ ok: false, error: "FEATURE_SOCIAL_CONTENT_AUTOPILOT_V2 disabled" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const r = await scanSocialContentCandidatesV2(Math.min(120, body.limit ?? 40));
  return Response.json({ ok: true, created: r.created });
}
