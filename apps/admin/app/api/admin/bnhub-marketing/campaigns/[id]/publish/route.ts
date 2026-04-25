import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertMarketingAdmin, MarketingAuthError } from "@/src/modules/bnhub-marketing/services/marketingAccess";
import {
  publishToFacebookMock,
  publishToGoogleAdsMock,
  publishToInstagramMock,
  publishToInternalBlogFeedMock,
  publishToInternalEmailMock,
  publishToInternalHomepageMock,
  publishToInternalSearchBoostMock,
  publishToTikTokMock,
} from "@/src/modules/bnhub-marketing/services/distributionService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertMarketingAdmin(await getGuestId());
    await params;
    const body = (await request.json()) as {
      distributionId: string;
      action:
        | "internal_homepage"
        | "internal_search_boost"
        | "internal_email"
        | "internal_blog_feed"
        | "instagram"
        | "facebook"
        | "tiktok"
        | "google_ads";
      boostPoints?: number;
    };
    const { distributionId, action, boostPoints } = body;
    let row;
    switch (action) {
      case "internal_homepage":
        row = await publishToInternalHomepageMock(distributionId);
        break;
      case "internal_search_boost":
        row = await publishToInternalSearchBoostMock(distributionId, boostPoints);
        break;
      case "internal_email":
        row = await publishToInternalEmailMock(distributionId);
        break;
      case "internal_blog_feed":
        row = await publishToInternalBlogFeedMock(distributionId);
        break;
      case "instagram":
        row = await publishToInstagramMock(distributionId);
        break;
      case "facebook":
        row = await publishToFacebookMock(distributionId);
        break;
      case "tiktok":
        row = await publishToTikTokMock(distributionId);
        break;
      case "google_ads":
        row = await publishToGoogleAdsMock(distributionId);
        break;
      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
    return Response.json({ distribution: row });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
