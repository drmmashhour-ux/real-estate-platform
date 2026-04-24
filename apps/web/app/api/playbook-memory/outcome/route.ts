import { NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import {
  appendOutcomeMetric,
  playbookMemoryWriteService,
} from "@/modules/playbook-memory/services/playbook-memory-write.service";
import type { MemoryOutcomeStatusLiteral, RecordOutcomeUpdateInput } from "@/modules/playbook-memory/types/playbook-memory.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OUTCOME_STATUSES: ReadonlySet<MemoryOutcomeStatusLiteral> = new Set([
  "PENDING",
  "PARTIAL",
  "SUCCEEDED",
  "FAILED",
  "NEUTRAL",
  "CANCELLED",
]);

const PB = "[playbook]";

/**
 * POST /api/playbook-memory/outcome
 * - `kind: "metric"` — append an outcome metric (unchanged contract).
 * - else — update record outcome by `memoryRecordId` (Wave 4 safe path, no learning).
 */
export async function POST(req: Request) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" as const }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_request" as const }, { status: 400 });
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
      // eslint-disable-next-line no-console
      console.log(PB, "outcome_metric_appended", { memoryRecordId: o.memoryRecordId });
      return NextResponse.json({ ok: true });
    }

    const memoryRecordId = typeof o.memoryRecordId === "string" ? o.memoryRecordId.trim() : "";
    const rawStatus = o.outcomeStatus;
    if (!memoryRecordId || typeof rawStatus !== "string" || !OUTCOME_STATUSES.has(rawStatus as MemoryOutcomeStatusLiteral)) {
      return NextResponse.json({ ok: false, error: "invalid_request" as const }, { status: 400 });
    }

    const payload: RecordOutcomeUpdateInput = {
      memoryRecordId,
      outcomeStatus: rawStatus as MemoryOutcomeStatusLiteral,
      outcomeSummary:
        typeof o.outcomeSummary === "object" && o.outcomeSummary !== null
          ? (o.outcomeSummary as Record<string, unknown>)
          : undefined,
      realizedValue: typeof o.realizedValue === "number" ? o.realizedValue : undefined,
      realizedRevenue: typeof o.realizedRevenue === "number" ? o.realizedRevenue : undefined,
      realizedConversion: typeof o.realizedConversion === "number" ? o.realizedConversion : undefined,
      realizedLatencyMs: typeof o.realizedLatencyMs === "number" ? o.realizedLatencyMs : undefined,
      realizedRiskScore: typeof o.realizedRiskScore === "number" ? o.realizedRiskScore : undefined,
    };

    const row = await playbookMemoryWriteService.recordOutcomeUpdate(payload);
    if (row === null) {
      // eslint-disable-next-line no-console
      console.error(PB, "outcome_update_failed", { memoryRecordId });
      return NextResponse.json({ ok: false, error: "outcome_update_failed" as const });
    }

    // `record` kept for legacy clients; `updated` matches Wave 4 spec.
    return NextResponse.json({ ok: true, updated: row, record: row });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(PB, "outcome_route_unexpected", e);
    return NextResponse.json({ ok: false, error: "outcome_update_failed" as const });
  }
}
