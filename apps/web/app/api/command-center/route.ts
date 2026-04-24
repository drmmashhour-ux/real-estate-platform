import { NextResponse } from "next/server";
import { buildCommandCenterAiPayload, getLatestCommandCenterSnapshotMeta } from "@/modules/command-center/command-center-ai.service";
import { requireCommandCenterActor } from "@/modules/command-center/command-center-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireCommandCenterActor();
  if (!actor.ok) return actor.response;

  const [payload, lastSnapshot] = await Promise.all([
    buildCommandCenterAiPayload(actor.userId, actor.role),
    getLatestCommandCenterSnapshotMeta(actor.userId),
  ]);

  return NextResponse.json({
    ...payload,
    lastPersistedSnapshot: lastSnapshot,
  });
}
