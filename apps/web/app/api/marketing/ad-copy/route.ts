import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { writeMarketplaceEvent } from "@/lib/analytics/tracker";
import { generateAdCopy } from "@/lib/marketing/adCopyEngine";
import { getCampaignFeedbackInsights } from "@/lib/marketing/campaignFeedback";
import { generateAdCopyWithLearning } from "@/lib/marketing/campaignLearning";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  audience: z.enum(["buyer", "seller", "host", "broker"]),
  city: z.string().max(80).optional(),
  platform: z.enum(["tiktok", "meta", "google"]).optional(),
  withLearning: z.boolean().optional(),
});

/**
 * POST /api/marketing/ad-copy — ad copy ideas (TikTok / Meta / Google starters).
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/marketing/ad-copy", phase: "parse_json" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const uid = await getGuestId();
  const insights = uid ? await getCampaignFeedbackInsights(uid) : null;
  const withLearning = parsed.data.withLearning === true && parsed.data.platform != null && Boolean(uid);
  const out = withLearning
    ? await generateAdCopyWithLearning({
        audience: parsed.data.audience,
        city: parsed.data.city,
        platform: parsed.data.platform!,
        userId: uid!,
        feedbackInsights: insights,
      })
    : generateAdCopy({
        audience: parsed.data.audience,
        city: parsed.data.city,
        feedbackInsights: insights ?? undefined,
      });
  const hasPattern = "patternLearnedVariant" in out && (out as { patternLearnedVariant?: unknown }).patternLearnedVariant;
  const hasFeedback = "learnedVariant" in out && (out as { learnedVariant?: unknown }).learnedVariant;
  void writeMarketplaceEvent("ad_copy_generated", {
    audience: parsed.data.audience,
    city: parsed.data.city ?? null,
    learned: Boolean(hasPattern || hasFeedback),
  }).catch(() => {});
  return Response.json(out);
}
