import { NextRequest, NextResponse } from "next/server";
import { exchangeForLongLivedUserToken, exchangeMetaAuthorizationCode } from "@/lib/integrations/meta/connect";
import { saveMetaOAuthConnections } from "@/lib/content-automation/social-oauth-meta";
import { verifyOAuthState } from "@/lib/oauth/state-signing";

export const dynamic = "force-dynamic";

function adminSocialRedirect(req: NextRequest, query: Record<string, string>) {
  const path = process.env.ADMIN_OAUTH_SUCCESS_PATH?.trim() ?? "/en/ca/admin/social";
  const u = new URL(path, req.nextUrl.origin);
  for (const [k, v] of Object.entries(query)) {
    u.searchParams.set(k, v);
  }
  return NextResponse.redirect(u);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state");
  const err = req.nextUrl.searchParams.get("error_description") ?? req.nextUrl.searchParams.get("error");

  if (err) {
    return adminSocialRedirect(req, { error: err.slice(0, 200) });
  }
  if (!code || !stateRaw) {
    return adminSocialRedirect(req, { error: "missing_code_or_state" });
  }

  const state = verifyOAuthState<{ userId: string; provider?: string; exp?: number }>(stateRaw);
  if (!state?.userId || state.provider !== "meta") {
    return adminSocialRedirect(req, { error: "invalid_state" });
  }

  try {
    const short = await exchangeMetaAuthorizationCode(code);
    const long = await exchangeForLongLivedUserToken(short.access_token);
    const expiresAt = long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : null;
    const saved = await saveMetaOAuthConnections({
      userId: state.userId,
      userAccessToken: long.access_token,
      expiresAt,
    });
    return adminSocialRedirect(req, {
      connected: "meta",
      instagram: saved.instagramLinked ? "1" : "0",
      fb_pages: String(saved.facebookPages),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "meta_oauth_failed";
    return adminSocialRedirect(req, { error: msg.slice(0, 200) });
  }
}
