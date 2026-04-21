import { NextResponse } from "next/server";
import type { MemoryOutcomeStatus } from "@prisma/client";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import {
  appendOutcomeMetric,
  recordOutcomeUpdate,
} from "@/modules/playbook-memory/services/playbook-memory-write.service";

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
  const kind = String(o.kind ?? "update");

  try {
    if (kind === "metric") {
      await appendOutcomeMetric({
        memoryRecordId: String(o.memoryRecordId ?? ""),
        metricKey: String(o.metricKey ?? ""),
        metricValue: typeof o.metricValue === "number" ? o.metricValue : undefined,
        metricText: o.metricText != null ? String(o.metricText) : undefined,
        metricJson:
          typeof o.metricJson === "object" && o.metricJson !== null
            ? (o.metricJson as Record<string, unknown>)
            : undefined,
        observedAt: o.observedAt ? new Date(String(o.observedAt)) : undefined,
        source: o.source != null ? String(o.source) : undefined,
      });
      return NextResponse.json({ ok: true });
    }

    const row = await recordOutcomeUpdate({
      memoryRecordId: String(o.memoryRecordId ?? ""),
      outcomeStatus: o.outcomeStatus as MemoryOutcomeStatus | undefined,
      outcomeSummary:
        typeof o.outcomeSummary === "object" && o.outcomeSummary !== null
          ? (o.outcomeSummary as Record<string, unknown>)
          : undefined,
      realizedValue: typeof o.realizedValue === "number" ? o.realizedValue : undefined,
      realizedRevenue: typeof o.realizedRevenue === "number" ? o.realizedRevenue : undefined,
      realizedConversion: typeof o.realizedConversion === "number" ? o.realizedConversion : undefined,
      realizedLatencyMs: typeof o.realizedLatencyMs === "number" ? o.realizedLatencyMs : undefined,
      realizedRiskScore: typeof o.realizedRiskScore === "number" ? o.realizedRiskScore : undefined,
    });
    return NextResponse.json({ ok: true, record: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "outcome_failed";
    const status = msg === "memory_record_not_found" ? 404 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
