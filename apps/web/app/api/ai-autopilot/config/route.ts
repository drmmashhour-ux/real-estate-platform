import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getOrCreateAutopilotLayerConfig, upsertAutopilotLayerConfig } from "@/modules/ai-autopilot-layer/autopilotConfig";
import { logAutopilotEvent } from "@/modules/ai-autopilot-layer/autopilotAuditLogger";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await requireAuthenticatedUser();
  const config = await getOrCreateAutopilotLayerConfig(userId);
  return NextResponse.json({ config, userId });
}

export async function POST(req: Request) {
  const { userId } = await requireAuthenticatedUser();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const config = await upsertAutopilotLayerConfig(userId, {
    mode: typeof body.mode === "string" ? body.mode : undefined,
    autoDrafting: typeof body.autoDrafting === "boolean" ? body.autoDrafting : undefined,
    autoReview: typeof body.autoReview === "boolean" ? body.autoReview : undefined,
    autoSuggestions: typeof body.autoSuggestions === "boolean" ? body.autoSuggestions : undefined,
    autoBrokerRoute: typeof body.autoBrokerRoute === "boolean" ? body.autoBrokerRoute : undefined,
    autoPricing: typeof body.autoPricing === "boolean" ? body.autoPricing : undefined,
    paused: typeof body.paused === "boolean" ? body.paused : undefined,
  });
  await logAutopilotEvent({
    userId,
    eventKey: "autopilot_config_updated",
    payload: { mode: config.mode, paused: config.paused },
  });
  return NextResponse.json({ config, userId });
}
