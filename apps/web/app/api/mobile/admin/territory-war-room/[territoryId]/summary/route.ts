import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import {
  buildTerritoryWarRoomMobileSummary,
  buildTerritoryWarRoomPayload,
} from "@/modules/territory-war-room/territory-war-room.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ territoryId: string }> }) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const { territoryId } = await ctx.params;

  try {
    const payload = await buildTerritoryWarRoomPayload(territoryId);
    if (!payload) {
      return NextResponse.json({ error: "territory_not_found" }, { status: 404 });
    }
    return NextResponse.json(buildTerritoryWarRoomMobileSummary(payload));
  } catch (e) {
    console.error("[mobile territory-war-room summary]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
