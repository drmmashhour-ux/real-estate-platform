import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  buildTerritoryWarRoomPayload,
  updateTerritoryWarRoomState,
  type WarRoomPhase,
} from "@/modules/territory-war-room/territory-war-room.service";

export const dynamic = "force-dynamic";

const PHASES = new Set<WarRoomPhase>(["DISCOVERY", "LAUNCH", "EXPAND", "DOMINATE"]);

function parsePhase(v: unknown): WarRoomPhase | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string" || !PHASES.has(v as WarRoomPhase)) return undefined;
  return v as WarRoomPhase;
}

export async function GET(_request: Request, ctx: { params: Promise<{ territoryId: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { territoryId } = await ctx.params;
  try {
    const payload = await buildTerritoryWarRoomPayload(territoryId);
    if (!payload) {
      return NextResponse.json({ error: "territory_not_found" }, { status: 404 });
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[admin territory-war-room GET]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: { params: Promise<{ territoryId: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { territoryId } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const phaseOverride = parsePhase(body.phaseOverride);
  if (body.phaseOverride !== undefined && phaseOverride === undefined) {
    return NextResponse.json({ error: "invalid_phase_override" }, { status: 400 });
  }

  const paused = typeof body.paused === "boolean" ? body.paused : undefined;
  const scaling = typeof body.scaling === "boolean" ? body.scaling : undefined;
  const expansionPlanNote =
    body.expansionPlanNote === null ? null : typeof body.expansionPlanNote === "string" ? body.expansionPlanNote : undefined;

  if (
    phaseOverride === undefined &&
    paused === undefined &&
    scaling === undefined &&
    expansionPlanNote === undefined
  ) {
    return NextResponse.json({ error: "no_updates" }, { status: 400 });
  }

  try {
    await updateTerritoryWarRoomState({
      territoryId,
      actorUserId: admin.userId,
      ...(phaseOverride !== undefined ? { phaseOverride } : {}),
      ...(paused !== undefined ? { paused } : {}),
      ...(scaling !== undefined ? { scaling } : {}),
      ...(expansionPlanNote !== undefined ? { expansionPlanNote } : {}),
    });
    const payload = await buildTerritoryWarRoomPayload(territoryId);
    return NextResponse.json(payload ?? { ok: true });
  } catch (e) {
    console.error("[admin territory-war-room PATCH]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
