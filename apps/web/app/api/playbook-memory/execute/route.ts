import { NextRequest, NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { playbookMemoryExecutionService } from "@/modules/playbook-memory/services/playbook-memory-execution.service";
import { buildExecutionPlan } from "@/modules/playbook-memory/utils/playbook-memory-execution";
import type { PlaybookComparableContext, PlaybookExecutionResult } from "@/modules/playbook-memory/types/playbook-memory.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isPlaybookItem(o: unknown): o is { itemType: "playbook" } {
  return typeof o === "object" && o !== null && (o as { itemType?: unknown }).itemType === "playbook";
}

function isComparableContext(o: unknown): o is PlaybookComparableContext {
  if (o === null || o === undefined || typeof o !== "object" || Array.isArray(o)) {
    return false;
  }
  const r = o as { domain?: unknown; entityType?: unknown };
  return typeof r.domain === "string" && typeof r.entityType === "string" && r.entityType.length > 0;
}

function invalidResult(): PlaybookExecutionResult {
  return {
    success: false,
    executed: false,
    mode: "RECOMMEND_ONLY",
    reason: "invalid_request",
    explanation: "A playbook recommendation (itemType: playbook) and valid fields are required to execute.",
  };
}

export async function POST(req: NextRequest) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, result: invalidResult() });
    }
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ ok: false, result: invalidResult() });
    }
    const b = body as { recommendation?: unknown; context?: unknown; payload?: unknown };
    if (!b.recommendation) {
      return NextResponse.json({ ok: false, result: invalidResult() });
    }
    if (!isPlaybookItem(b.recommendation)) {
      return NextResponse.json({ ok: false, result: invalidResult() });
    }
    if (b.context != null && !isComparableContext(b.context)) {
      return NextResponse.json({ ok: false, result: invalidResult() });
    }

    const plan = buildExecutionPlan(b.recommendation);
    const extra =
      b.payload && typeof b.payload === "object" && !Array.isArray(b.payload)
        ? (b.payload as Record<string, unknown>)
        : {};
    plan.payload = {
      ...extra,
      ...(b.context ? { memoryContext: b.context } : {}),
    };

    const r = await playbookMemoryExecutionService.execute(plan);
    const ok = r.success;
    return NextResponse.json({ ok, result: r });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      result: {
        success: false,
        executed: false,
        mode: "RECOMMEND_ONLY" as const,
        reason: "request_error",
        explanation: e instanceof Error ? e.message : "Unexpected error handling execute request.",
      } satisfies PlaybookExecutionResult,
    });
  }
}
