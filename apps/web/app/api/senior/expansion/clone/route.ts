import { NextResponse } from "next/server";
import { logSeniorCommand } from "@/lib/senior-command/log";
import { seniorCommandAuth, canOps, canPricing } from "@/lib/senior-command/api-auth";
import { cloneSeniorCityConfiguration } from "@/modules/senior-living/expansion/senior-city-clone.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  if (!canOps(auth.ctx)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { sourceCityId?: string; targetCityId?: string; applyGlobalWeights?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sourceCityId, targetCityId } = body;
  if (!sourceCityId || !targetCityId) {
    return NextResponse.json({ error: "sourceCityId and targetCityId required" }, { status: 400 });
  }

  const applyGlobalWeights = Boolean(body.applyGlobalWeights);
  if (applyGlobalWeights && !canPricing(auth.ctx)) {
    return NextResponse.json({ error: "applyGlobalWeights requires admin" }, { status: 403 });
  }

  logSeniorCommand("[senior-expansion]", "clone_config", {
    userId: auth.ctx.userId.slice(0, 8),
    source: sourceCityId.slice(0, 8),
    target: targetCityId.slice(0, 8),
    applyGlobalWeights,
  });

  try {
    const result = await cloneSeniorCityConfiguration({
      sourceCityId,
      targetCityId,
      applyGlobalWeights,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Clone failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
