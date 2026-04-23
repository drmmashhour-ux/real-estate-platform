import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { createOrUpdateShareLink } from "@/modules/sharing/application/createShareLink";

export const dynamic = "force-dynamic";

/**
 * POST /api/sharing/links — create a trackable share link (OG preview uses /api/og/share/[token]).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const resourceType = typeof body.resourceType === "string" ? body.resourceType : "";
  const resourceKey = typeof body.resourceKey === "string" ? body.resourceKey : "";
  if (!resourceType || !resourceKey) {
    return NextResponse.json({ error: "resourceType and resourceKey required" }, { status: 400 });
  }

  const userId = await getGuestId();

  const title = typeof body.title === "string" ? body.title : null;
  const summaryLine = typeof body.summaryLine === "string" ? body.summaryLine : null;
  const trustScoreHint = typeof body.trustScoreHint === "number" ? body.trustScoreHint : null;
  const dealScoreHint = typeof body.dealScoreHint === "number" ? body.dealScoreHint : null;

  const { token } = await createOrUpdateShareLink(prisma, {
    resourceType,
    resourceKey,
    title,
    summaryLine,
    trustScoreHint,
    dealScoreHint,
    creatorUserId: userId,
  });

  const base = getSiteBaseUrl();
  return NextResponse.json({
    token,
    shortUrl: `${base}/r/${token}`,
    sharePageUrl: `${base}/share/${token}`,
    ogImageUrl: `${base}/api/og/share/${token}`,
  });
}
