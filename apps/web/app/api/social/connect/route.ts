import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getMetaOAuthAuthorizeUrl } from "@/lib/integrations/meta/connect";
import { getBufferOAuthAuthorizeUrl, getMetricoolConnectInstructions } from "@/lib/integrations/scheduler/connect";
import { signOAuthState } from "@/lib/oauth/state-signing";

export const dynamic = "force-dynamic";

/**
 * Start OAuth for Meta (Instagram + Facebook Pages) or Buffer. Admin only.
 */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    provider?: "meta" | "buffer" | "metricool";
  };

  const exp = Date.now() + 600_000;
  if (body.provider === "meta") {
    const state = signOAuthState({ userId, provider: "meta", exp });
    const url = getMetaOAuthAuthorizeUrl(state);
    if (!url) {
      return NextResponse.json(
        { error: "Meta OAuth not configured (META_APP_ID, META_OAUTH_REDIRECT_URI)" },
        { status: 501 },
      );
    }
    return NextResponse.json({ url, provider: "meta" });
  }

  if (body.provider === "buffer") {
    const state = signOAuthState({ userId, provider: "buffer", exp });
    const url = getBufferOAuthAuthorizeUrl(state);
    if (!url) {
      return NextResponse.json(
        { error: "Buffer OAuth not configured (BUFFER_CLIENT_ID, BUFFER_OAUTH_REDIRECT_URI)" },
        { status: 501 },
      );
    }
    return NextResponse.json({ url, provider: "buffer" });
  }

  if (body.provider === "metricool") {
    return NextResponse.json({
      provider: "metricool",
      instructions: getMetricoolConnectInstructions(),
    });
  }

  return NextResponse.json({ error: "provider must be meta, buffer, or metricool" }, { status: 400 });
}
