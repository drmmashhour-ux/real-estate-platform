import { NextResponse } from "next/server";
import { MemorySource } from "@prisma/client";

function isMemorySource(v: unknown): v is MemorySource {
  return typeof v === "string" && (Object.values(MemorySource) as string[]).includes(v);
}
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { recordDecision } from "@/modules/playbook-memory/services/playbook-memory-write.service";
import type { PlaybookComparableContext } from "@/modules/playbook-memory/types/playbook-memory.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body required" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  try {
    const ctx = o.context as PlaybookComparableContext;
    if (!ctx?.domain || !ctx.entityType) {
      return NextResponse.json({ error: "context.domain and context.entityType required" }, { status: 400 });
    }
    if (!isMemorySource(o.source)) {
      return NextResponse.json({ error: "valid source enum required" }, { status: 400 });
    }
    const row = await recordDecision({
      source: o.source,
      triggerEvent: String(o.triggerEvent ?? ""),
      actionType: String(o.actionType ?? ""),
      actionVersion: o.actionVersion != null ? String(o.actionVersion) : undefined,
      actorUserId: o.actorUserId != null ? String(o.actorUserId) : undefined,
      actorSystem: o.actorSystem != null ? String(o.actorSystem) : undefined,
      actorRole: o.actorRole != null ? String(o.actorRole) : undefined,
      memoryPlaybookId: o.memoryPlaybookId != null ? String(o.memoryPlaybookId) : undefined,
      memoryPlaybookVersionId:
        o.memoryPlaybookVersionId != null ? String(o.memoryPlaybookVersionId) : undefined,
      listingId: o.listingId != null ? String(o.listingId) : undefined,
      leadId: o.leadId != null ? String(o.leadId) : undefined,
      dealId: o.dealId != null ? String(o.dealId) : undefined,
      bookingId: o.bookingId != null ? String(o.bookingId) : undefined,
      brokerId: o.brokerId != null ? String(o.brokerId) : undefined,
      customerId: o.customerId != null ? String(o.customerId) : undefined,
      context: ctx,
      actionPayload: (typeof o.actionPayload === "object" && o.actionPayload !== null
        ? o.actionPayload
        : {}) as Record<string, unknown>,
      policySnapshot: o.policySnapshot as Record<string, unknown> | undefined,
      riskSnapshot: o.riskSnapshot as Record<string, unknown> | undefined,
      objectiveSnapshot: o.objectiveSnapshot as Record<string, unknown> | undefined,
      initialConfidence: typeof o.initialConfidence === "number" ? o.initialConfidence : undefined,
      safetyScore: typeof o.safetyScore === "number" ? o.safetyScore : undefined,
      expectedValue: typeof o.expectedValue === "number" ? o.expectedValue : undefined,
      idempotencyKey: o.idempotencyKey != null ? String(o.idempotencyKey) : undefined,
    });
    return NextResponse.json({ ok: true, record: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "record_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
