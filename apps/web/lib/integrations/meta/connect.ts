/**
 * Meta (Facebook Login) OAuth for Instagram Business + Facebook Page publishing.
 * Uses official Graph API only — no scraping.
 *
 * Required env:
 * - META_APP_ID
 * - META_APP_SECRET
 * - META_OAUTH_REDIRECT_URI (e.g. https://app.example.com/api/social/meta/callback)
 *
 * Scopes (request minimal set): instagram_basic, instagram_content_publish, pages_show_list, pages_read_engagement, business_management
 */

import { graphApiUrl } from "./graph-client";

export function getMetaOAuthAuthorizeUrl(state: string): string | null {
  const appId = process.env.META_APP_ID?.trim();
  const redirect = process.env.META_OAUTH_REDIRECT_URI?.trim();
  if (!appId || !redirect) return null;

  const scope = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ].join(",");

  const u = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  u.searchParams.set("client_id", appId);
  u.searchParams.set("redirect_uri", redirect);
  u.searchParams.set("state", state);
  u.searchParams.set("scope", scope);
  u.searchParams.set("response_type", "code");
  return u.toString();
}

export type MetaTokenExchangeResult = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

/**
 * Exchange authorization code for a short-lived user access token.
 */
export async function exchangeMetaAuthorizationCode(code: string): Promise<MetaTokenExchangeResult> {
  const appId = process.env.META_APP_ID?.trim();
  const secret = process.env.META_APP_SECRET?.trim();
  const redirect = process.env.META_OAUTH_REDIRECT_URI?.trim();
  if (!appId || !secret || !redirect) {
    throw new Error("META_APP_ID / META_APP_SECRET / META_OAUTH_REDIRECT_URI not configured");
  }

  const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirect)}&client_secret=${encodeURIComponent(secret)}&code=${encodeURIComponent(code)}`;
  const res = await fetch(tokenUrl, { method: "GET" });
  const json = (await res.json()) as MetaTokenExchangeResult & { error?: { message?: string } };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error?.message ?? "Meta token exchange failed");
  }
  return json;
}

/**
 * Exchange short-lived token for long-lived (≈60 days).
 */
export async function exchangeForLongLivedUserToken(shortLivedToken: string): Promise<MetaTokenExchangeResult> {
  const appId = process.env.META_APP_ID?.trim();
  const secret = process.env.META_APP_SECRET?.trim();
  if (!appId || !secret) throw new Error("META_APP_ID / META_APP_SECRET not configured");

  const url = graphApiUrl("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: secret,
    fb_exchange_token: shortLivedToken,
  });
  const res = await fetch(url);
  const json = (await res.json()) as MetaTokenExchangeResult & { error?: { message?: string } };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error?.message ?? "Long-lived token exchange failed");
  }
  return json;
}
