import { NextResponse } from "next/server";
import { buildCommandCenterAiPayload } from "@/modules/command-center/command-center-ai.service";
import { requireCommandCenterActor } from "@/modules/command-center/command-center-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireCommandCenterActor();
  if (!actor.ok) return actor.response;

  const { recommendations, context } = await buildCommandCenterAiPayload(actor.userId, actor.role);
  return NextResponse.json({ generatedAt: context.generatedAt, recommendations });
}
