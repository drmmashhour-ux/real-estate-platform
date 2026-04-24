import { NextRequest, NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import {
  getRecommendations,
  playbookMemoryRetrievalService,
} from "@/modules/playbook-memory/services/playbook-memory-retrieval.service";
import type { PlaybookComparableContext } from "@/modules/playbook-memory/types/playbook-memory.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams;
  const raw = q.get("context");
  if (!raw) {
    return NextResponse.json({ error: "context query param (JSON) required" }, { status: 400 });
  }

  let context: PlaybookComparableContext;
  try {
    context = JSON.parse(raw) as PlaybookComparableContext;
  } catch {
    return NextResponse.json({ error: "context must be valid JSON" }, { status: 400 });
  }

  if (!context.domain || !context.entityType) {
    return NextResponse.json({ error: "context.domain and context.entityType required" }, { status: 400 });
  }

  const candidateIds = q.get("candidatePlaybookIds");
  const recommendations = await getRecommendations({
    context,
    candidatePlaybookIds: candidateIds ? candidateIds.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
  });

  return NextResponse.json({ ok: true, recommendations });
}

export async function POST(req: NextRequest) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true, recommendations: [] });
  }
  try {
    const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const context =
      o.context !== null && o.context !== undefined && typeof o.context === "object" && !Array.isArray(o.context)
        ? o.context
        : o;
    const recommendations = await playbookMemoryRetrievalService.getRecommendations(context);
    return NextResponse.json({ ok: true, recommendations });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[playbook]", "recommendations_api_failed", error);
    return NextResponse.json({ ok: true, recommendations: [] });
  }
}
