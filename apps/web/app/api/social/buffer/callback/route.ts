import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { Prisma } from "@prisma/client";
import { exchangeBufferAuthorizationCode } from "@/lib/integrations/scheduler/connect";
import { encryptTokens } from "@/lib/content-automation/social-accounts";
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
  if (!state?.userId || state.provider !== "buffer") {
    return adminSocialRedirect(req, { error: "invalid_state" });
  }

  try {
    const { access_token } = await exchangeBufferAuthorizationCode(code);
    const profRes = await fetch(
      `https://api.bufferapp.com/1/profiles.json?access_token=${encodeURIComponent(access_token)}`,
    );
    const profJson = (await profRes.json()) as unknown;
    const list = Array.isArray(profJson)
      ? profJson
      : typeof profJson === "object" && profJson && "profiles" in profJson && Array.isArray((profJson as { profiles: unknown }).profiles)
        ? (profJson as { profiles: { id?: string }[] }).profiles
        : [];
    const profileIds = list.map((p) => p.id).filter((x): x is string => typeof x === "string");

    const enc = encryptTokens({ accessToken: access_token, expiresAt: null });

    const existing = await prisma.socialAccount.findFirst({
      where: { userId: state.userId, platform: "buffer" },
    });
    const data = {
      userId: state.userId,
      platform: "buffer",
      accountId: profileIds[0] ?? "buffer",
      accountName: "Buffer",
      accessTokenEncrypted: enc.accessTokenEncrypted,
      refreshTokenEncrypted: enc.refreshTokenEncrypted,
      expiresAt: enc.expiresAt,
      metadataJson: { bufferProfileIds: profileIds, source: "buffer_oauth" } as Prisma.InputJsonValue,
      lastSyncAt: new Date(),
    };
    if (existing) {
      await prisma.socialAccount.update({ where: { id: existing.id }, data });
    } else {
      await prisma.socialAccount.create({ data });
    }

    return adminSocialRedirect(req, { connected: "buffer", profiles: String(profileIds.length) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "buffer_oauth_failed";
    return adminSocialRedirect(req, { error: msg.slice(0, 200) });
  }
}
