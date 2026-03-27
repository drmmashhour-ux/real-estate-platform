import type { GrowthMarketingPlatform } from "@prisma/client";

export type RefreshOk =
  | { ok: true; accessToken: string; refreshToken?: string | null; expiresAt?: Date | null }
  | { ok: false; error: string };

/**
 * Official OAuth token refresh endpoints only. Requires client id/secret in env per provider.
 */
export async function refreshOAuthTokens(args: {
  platform: GrowthMarketingPlatform;
  refreshToken: string | null;
  externalAccountId: string;
}): Promise<RefreshOk> {
  if (!args.refreshToken) {
    return { ok: false, error: "No refresh token stored for this channel" };
  }

  switch (args.platform) {
    case "YOUTUBE": {
      const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
      const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
      if (!cid || !secret) {
        return { ok: false, error: "GOOGLE_OAUTH_CLIENT_ID/SECRET not configured" };
      }
      const body = new URLSearchParams({
        client_id: cid,
        client_secret: secret,
        refresh_token: args.refreshToken,
        grant_type: "refresh_token",
      });
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        return { ok: false, error: String(json.error_description || json.error || res.status) };
      }
      const access = json.access_token as string | undefined;
      if (!access) return { ok: false, error: "No access_token in Google response" };
      const expiresIn = Number(json.expires_in || 3600);
      return {
        ok: true,
        accessToken: access,
        refreshToken: args.refreshToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    }
    case "LINKEDIN": {
      const cid = process.env.LINKEDIN_CLIENT_ID;
      const secret = process.env.LINKEDIN_CLIENT_SECRET;
      if (!cid || !secret) {
        return { ok: false, error: "LINKEDIN_CLIENT_ID/SECRET not configured" };
      }
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: args.refreshToken,
        client_id: cid,
        client_secret: secret,
      });
      const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        return { ok: false, error: String(json.error_description || json.error || res.status) };
      }
      const access = json.access_token as string | undefined;
      if (!access) return { ok: false, error: "No access_token in LinkedIn response" };
      const expiresIn = Number(json.expires_in || 3600);
      return {
        ok: true,
        accessToken: access,
        refreshToken: (json.refresh_token as string) || args.refreshToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    }
    case "INSTAGRAM": {
      const appId = process.env.META_APP_ID;
      const secret = process.env.META_APP_SECRET;
      if (!appId || !secret) {
        return { ok: false, error: "META_APP_ID/META_APP_SECRET not configured" };
      }
      const res = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
          appId,
        )}&client_secret=${encodeURIComponent(secret)}&fb_exchange_token=${encodeURIComponent(
          args.refreshToken,
        )}`,
      );
      const json = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
        error?: { message?: string } | string;
      };
      if (!res.ok) {
        const e = json.error;
        const msg = typeof e === "object" && e && "message" in e ? e.message : e;
        return { ok: false, error: String(msg ?? res.status) };
      }
      const access = json.access_token as string | undefined;
      if (!access) return { ok: false, error: "No access_token in Meta response" };
      const expiresIn = Number(json.expires_in || 5184000);
      return {
        ok: true,
        accessToken: access,
        refreshToken: access,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    }
    case "TIKTOK": {
      const key = process.env.TIKTOK_CLIENT_KEY;
      const secret = process.env.TIKTOK_CLIENT_SECRET;
      if (!key || !secret) {
        return { ok: false, error: "TIKTOK_CLIENT_KEY/SECRET not configured" };
      }
      const body = {
        client_key: key,
        client_secret: secret,
        grant_type: "refresh_token",
        refresh_token: args.refreshToken,
      };
      const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { data?: { access_token?: string; refresh_token?: string; expires_in?: number }; error?: string };
      const access = json.data?.access_token;
      if (!access) {
        return { ok: false, error: json.error || "TikTok refresh failed" };
      }
      const expiresIn = Number(json.data?.expires_in || 86400);
      return {
        ok: true,
        accessToken: access,
        refreshToken: json.data?.refresh_token ?? args.refreshToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    }
    default:
      return { ok: false, error: `No OAuth refresh implemented for ${args.platform}` };
  }
}
