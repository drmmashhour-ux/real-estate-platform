import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { GROWTH_CITY_SLUGS, type GrowthCitySlug } from "@/lib/growth/geo-slugs";
import { runMarketingEngineDaily } from "@/modules/marketing-engine/pipeline";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/cron/ai-marketing-engine-daily — generate blog + social + email, schedule channels, sweep publish, attach optimization hints.
 * Authorization: Bearer $CRON_SECRET
 *
 * Optional headers:
 * - x-marketing-city: growth city slug (e.g. montreal)
 * - x-marketing-weekly-blog: 1 — also run `ensureWeeklyGrowthBlogPost`
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cityHeader = req.headers.get("x-marketing-city")?.trim();
  const citySlug =
    cityHeader && (GROWTH_CITY_SLUGS as readonly string[]).includes(cityHeader) ? (cityHeader as GrowthCitySlug) : undefined;
  const weeklyBlog = req.headers.get("x-marketing-weekly-blog")?.trim() === "1";

  const result = await runMarketingEngineDaily(prisma, {
    citySlug,
    weeklyBlog: weeklyBlog || undefined,
  });

  return Response.json({ ok: true, message: "LECIPM AI MARKETING ENGINE ACTIVE", ...result });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
