import { z } from "zod";

import { createCampaign } from "@/lib/marketing/campaignEngine";
import { writeMarketplaceEvent } from "@/lib/analytics/tracker";
import { flags } from "@/lib/flags";
import { requireUser } from "@/lib/auth/require-user";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const BodyZ = z
  .object({
    audience: z.enum(["buyer", "seller", "host", "broker"]),
    city: z.string().max(120).optional().nullable(),
    platform: z.enum(["tiktok", "meta", "google"]),
    headline: z.string().min(1).max(4000),
    body: z.string().min(1).max(16000),
    createdBy: z.enum(["broker", "ai"]).optional(),
  })
  .strict()
  .refine(
    (d) => d.headline.trim().length > 0 && d.body.trim().length > 0,
    { message: "headline and body must not be empty" }
  );

/**
 * POST /api/marketing/campaign/create — draft simulated campaign (Order 38).
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!flags.AUTONOMOUS_AGENT) {
    return Response.json({ error: "Autonomous marketing disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/marketing/campaign/create", phase: "parse" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const d = parsed.data;
    const campaign = await createCampaign({
      userId,
      audience: d.audience,
      city: d.city,
      platform: d.platform,
      headline: d.headline.trim(),
      body: d.body.trim(),
      createdBy: d.createdBy ?? "broker",
    });
    void writeMarketplaceEvent("campaign_created", {
      userId,
      campaignId: campaign.id,
      platform: campaign.platform,
      audience: campaign.audience,
      createdBy: campaign.createdBy,
    }).catch(() => {});

    return Response.json({ campaign });
  } catch (e) {
    logError(e, { route: "/api/marketing/campaign/create" });
    return Response.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
