import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import type { PersonalizedRecommendationItem } from "@/modules/personalized-recommendations";
import {
  getPersonalizedRecommendations,
  parseBoolParam,
  parseRecommendationMode,
} from "@/modules/personalized-recommendations";

export const dynamic = "force-dynamic";

async function isDebugAllowed(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return u?.role === PlatformRole.ADMIN;
}

function stripFactors(item: PersonalizedRecommendationItem, keep: boolean): PersonalizedRecommendationItem {
  if (keep) return item;
  const { factorsInternal: _f, ...rest } = item;
  return { ...rest, factorsInternal: {} };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = parseRecommendationMode(sp.get("mode"));
  const limit = Math.min(parseInt(sp.get("limit") ?? "12", 10) || 12, 48);
  const marketSegment = sp.get("marketSegment")?.trim() || null;
  const personalization = parseBoolParam(sp.get("personalization"), true);
  const debugRequested = sp.get("debug") === "1";
  const cityHint = sp.get("city")?.trim() || null;

  const sessionUserId = await getGuestId();
  const debug = debugRequested && (await isDebugAllowed(sessionUserId));

  const result = await getPersonalizedRecommendations({
    userId: sessionUserId,
    mode,
    limit,
    marketSegment,
    personalization,
    debug,
    cityHint,
  });

  return NextResponse.json({
    ...result,
    items: result.items.map((i) => stripFactors(i, debug)),
    debug: debug ? result.debug : undefined,
  });
}
