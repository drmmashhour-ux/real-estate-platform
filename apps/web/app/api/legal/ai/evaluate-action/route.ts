import { NextResponse } from "next/server";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo-mode";
import { AI_LEGAL_DISCLAIMER } from "@/lib/legal/ai-legal-disclaimer";
import { demoLegalActionWarning } from "@/lib/legal/demo-legal-ai";
import { evaluateLegalContextHeuristic } from "@/lib/legal/heuristic-legal-context";
import { aiExplainLegalActionRisk } from "@/lib/legal/ai-legal-service";
import type { AiHub } from "@/modules/ai/core/types";

export const dynamic = "force-dynamic";

const HUBS = new Set(["seller", "bnhub", "buyer", "broker"]);

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({
      ok: true,
      source: "demo" as const,
      riskDetected: demoLegalActionWarning.riskDetected,
      requiresConfirmation: demoLegalActionWarning.requiresConfirmation,
      message: demoLegalActionWarning.message,
      heuristic: { riskScore: 62, reason: "Demo warning sample." },
      disclaimer: demoLegalActionWarning.disclaimer,
    });
  }

  let body: { hub?: string; actionType?: string; entity?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const hubRaw = typeof body.hub === "string" ? body.hub : "seller";
  const hub = (HUBS.has(hubRaw) ? hubRaw : "seller") as AiHub;
  const actionType = typeof body.actionType === "string" ? body.actionType.trim() : "";
  const entity = body.entity && typeof body.entity === "object" ? body.entity : {};
  if (!actionType) {
    return NextResponse.json({ error: "actionType required" }, { status: 400 });
  }

  const heuristic = evaluateLegalContextHeuristic({ hub, actionType, entity });
  const role = (await getUserRole()) ?? "user";

  const aiHub: AiHub = hub === "bnhub" ? "bnhub" : hub === "buyer" || hub === "broker" ? "buyer" : "seller";
  const r = await aiExplainLegalActionRisk({
    userId,
    role,
    hub: aiHub,
    actionType,
    entity,
    heuristic,
  });

  const requiresConfirmation = heuristic.requiresConfirmation;
  const riskDetected = requiresConfirmation;

  return NextResponse.json({
    ok: true,
    source: r.source,
    riskDetected,
    requiresConfirmation,
    message: r.text,
    heuristic: {
      riskScore: heuristic.riskScore,
      reason: heuristic.reason,
    },
    disclaimer: AI_LEGAL_DISCLAIMER,
    logId: r.logId,
  });
}
