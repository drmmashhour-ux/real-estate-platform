import { NextRequest, NextResponse } from "next/server";
import { processNurtureOutbox } from "@/modules/growth/email-automation.service";
import { processDueSocialPosts, seedDailyGrowthPosts } from "@/modules/growth/social.service";

export const dynamic = "force-dynamic";

/** Cron: nurture emails + social queue. Secure with CRON_SECRET. */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams;
  const seed = url.get("seedDaily") === "1";

  const nurture = await processNurtureOutbox();
  const social = await processDueSocialPosts();
  let seeded = 0;
  if (seed) {
    seeded = await seedDailyGrowthPosts(new Date());
  }

  return NextResponse.json({
    ok: true,
    nurture,
    social,
    seededDailyPosts: seeded,
  });
}
