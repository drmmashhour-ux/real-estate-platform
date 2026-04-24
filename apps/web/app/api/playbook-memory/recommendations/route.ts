import { NextRequest, NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { playbookIntelligenceOrchestratorService } from "@/modules/playbook-intelligence/services/playbook-intelligence-orchestrator.service";
import type { PlaybookComparableContext, PlaybookExecutionMode, RetrievalContextInput } from "@/modules/playbook-memory/types/playbook-memory.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isPlaybookContext(o: unknown): o is PlaybookComparableContext {
  if (o === null || o === undefined || typeof o !== "object" || Array.isArray(o)) {
    return false;
  }
  const r = o as { domain?: unknown; entityType?: unknown };
  return (
    typeof r.entityType === "string" &&
    r.entityType.length > 0 &&
    typeof r.domain === "string" &&
    r.domain.length > 0
  );
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = req.nextUrl.searchParams;
  const raw = q.get("context");
  if (raw == null) {
    return NextResponse.json({
      recommendations: [],
      source: "none" as const,
      transferUsed: false,
      error: "invalid_request",
    });
  }
  const parsed = safeJsonParse(raw);
  if (!isPlaybookContext(parsed)) {
    return NextResponse.json({
      recommendations: [],
      source: "none" as const,
      transferUsed: false,
      error: "invalid_request",
    });
  }
  const candidateIds = q.get("candidatePlaybookIds");
  const input: RetrievalContextInput = {
    context: parsed,
    candidatePlaybookIds: candidateIds
      ? candidateIds.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
  };
  const { recommendations, source, transferUsed } =
    await playbookIntelligenceOrchestratorService.getIntelligentRecommendations(input);
  return NextResponse.json({ recommendations, source, transferUsed, ok: true as const });
}

export async function POST(req: NextRequest) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({
      recommendations: [],
      source: "none" as const,
      transferUsed: false,
      error: "invalid_request",
    });
  }
  const o = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  const context = o
    ? o.context !== null && o.context !== undefined && typeof o.context === "object" && !Array.isArray(o.context)
      ? o.context
      : body
    : null;
  if (!isPlaybookContext(context)) {
    return NextResponse.json({
      recommendations: [],
      source: "none" as const,
      transferUsed: false,
      error: "invalid_request",
    });
  }
  const hintRaw = o?.autonomyModeHint;
  const input: RetrievalContextInput = {
    context: context as PlaybookComparableContext,
    candidatePlaybookIds: Array.isArray(o?.candidatePlaybookIds)
      ? (o!.candidatePlaybookIds as unknown[]).map((x) => String(x)).filter(Boolean)
      : undefined,
    policyFlags: o && typeof o.policyFlags === "object" && o.policyFlags !== null && !Array.isArray(o.policyFlags)
      ? (o.policyFlags as RetrievalContextInput["policyFlags"])
      : undefined,
    autonomyMode: typeof o?.autonomyMode === "string" ? o.autonomyMode as RetrievalContextInput["autonomyMode"] : undefined,
    autonomyModeHint:
      typeof hintRaw === "string" && hintRaw
        ? (hintRaw as PlaybookExecutionMode)
        : undefined,
  };
  const { recommendations, source, transferUsed } =
    await playbookIntelligenceOrchestratorService.getIntelligentRecommendations(input);
  return NextResponse.json({ recommendations, source, transferUsed, ok: true as const });
}
