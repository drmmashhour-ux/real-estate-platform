import { NextResponse } from "next/server";
import { REVENUE_PLATFORM_SCOPE_ID } from "@/lib/revenue-autopilot/constants";
import {
  getOrCreateRevenueAutopilotSettings,
  updateRevenueAutopilotSettings,
} from "@/lib/revenue-autopilot/get-revenue-settings";
import { requireRevenueScope } from "@/lib/revenue-autopilot/revenue-guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const st = url.searchParams.get("scopeType") as "owner" | "platform" | null;
  const sid = url.searchParams.get("scopeId");

  const scopeType = st === "platform" ? "platform" : "owner";
  const gate = await requireRevenueScope({
    scopeType,
    scopeId: scopeType === "platform" ? REVENUE_PLATFORM_SCOPE_ID : sid,
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const row = await getOrCreateRevenueAutopilotSettings(gate.scopeType, gate.scopeId);
  return NextResponse.json(row);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown> & {
    scopeType?: "owner" | "platform";
    scopeId?: string;
  };
  const scopeType = body.scopeType === "platform" ? "platform" : "owner";
  const gate = await requireRevenueScope({
    scopeType,
    scopeId: scopeType === "platform" ? REVENUE_PLATFORM_SCOPE_ID : typeof body.scopeId === "string" ? body.scopeId : undefined,
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const allowedKeys = [
    "mode",
    "autoPromoteTopListings",
    "autoGenerateRevenueActions",
    "allowPriceRecommendations",
  ] as const;
  const data: Partial<Record<(typeof allowedKeys)[number], unknown>> = {};
  for (const k of allowedKeys) {
    if (k in body) data[k] = body[k];
  }

  const row = await updateRevenueAutopilotSettings(
    gate.scopeType,
    gate.scopeId,
    data as Parameters<typeof updateRevenueAutopilotSettings>[2]
  );
  return NextResponse.json(row);
}
