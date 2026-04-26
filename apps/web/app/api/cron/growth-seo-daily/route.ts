import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { GROWTH_CITY_SLUGS, type GrowthCitySlug } from "@/lib/growth/geo-slugs";
import {
  ensureWeeklyGrowthBlogPost,
  refreshSeoContentForCity,
} from "@/modules/growth-engine/seoContentGenerator";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/cron/growth-seo-daily — refresh `SeoPageContent` for all growth cities + optional weekly blog stub.
 * Vercel Cron: GET + `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { city: string; seo: string; blog?: { slug: string; created: boolean } }[] = [];

  for (const city of GROWTH_CITY_SLUGS) {
    await refreshSeoContentForCity(prisma, city as GrowthCitySlug);
    results.push({ city, seo: "ok" });
  }

  const blogFlag = process.env.GROWTH_WEEKLY_BLOG?.trim() === "1";
  if (blogFlag) {
    const idx = new Date().getUTCDay() % GROWTH_CITY_SLUGS.length;
    const rot = GROWTH_CITY_SLUGS[idx]!;
    const blog = await ensureWeeklyGrowthBlogPost(prisma, rot as GrowthCitySlug);
    const prev = results[idx]!;
    results[idx] = { ...prev, blog };
  }

  return Response.json({ ok: true, results });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
