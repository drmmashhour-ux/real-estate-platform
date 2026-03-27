import { NextResponse } from "next/server";
import { GrowthMarketingPlatform } from "@prisma/client";
import { connectChannel } from "@/src/modules/growth-automation/application/connectChannel";
import { requireGrowthAutomationAdmin } from "@/src/modules/growth-automation/infrastructure/growthApiAuth";

export const dynamic = "force-dynamic";

const PLATFORMS = new Set(Object.values(GrowthMarketingPlatform));

export async function POST(req: Request) {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const platform = body.platform as GrowthMarketingPlatform;
  if (!platform || !PLATFORMS.has(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }
  const externalAccountId = typeof body.externalAccountId === "string" ? body.externalAccountId.trim() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
  if (!externalAccountId || !displayName || !accessToken) {
    return NextResponse.json(
      { error: "externalAccountId, displayName, and accessToken are required (OAuth tokens from your official OAuth callback)" },
      { status: 400 },
    );
  }
  const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken : null;
  const scopes = Array.isArray(body.scopes) ? body.scopes.map(String) : [];
  const tokenExpiresAt = typeof body.tokenExpiresAt === "string" ? body.tokenExpiresAt : null;

  try {
    const row = await connectChannel({
      platform,
      externalAccountId,
      displayName,
      accessToken,
      refreshToken,
      scopes,
      tokenExpiresAt,
    });
    return NextResponse.json({
      channel: {
        id: row.id,
        platform: row.platform,
        externalAccountId: row.externalAccountId,
        displayName: row.displayName,
        status: row.status,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Connect failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
