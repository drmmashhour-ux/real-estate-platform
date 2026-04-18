import type { SecurityEventSeverity } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { securityHardeningV1Flags } from "@/config/feature-flags";
import { logSecurityEvent } from "@/modules/security/security-log.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SEVERITIES: SecurityEventSeverity[] = ["info", "low", "medium", "high", "critical"];

/**
 * Server-to-server security audit ingest (middleware / workers). Not for browsers.
 * Authorization: Bearer CRON_SECRET (same pattern as `/api/internal/demo-event`).
 * Skipped when `FEATURE_SECURITY_LOGGING_V1=false` (returns 200 with skipped).
 */
export async function POST(req: NextRequest) {
  if (!securityHardeningV1Flags.securityLoggingV1) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    type?: string;
    severity?: string;
    userId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    path?: string | null;
    metadata?: Record<string, unknown>;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = typeof body.type === "string" ? body.type.trim() : "";
  if (!type) {
    return NextResponse.json({ error: "type required" }, { status: 400 });
  }

  let severity: SecurityEventSeverity = "low";
  if (typeof body.severity === "string" && SEVERITIES.includes(body.severity as SecurityEventSeverity)) {
    severity = body.severity as SecurityEventSeverity;
  }

  const result = await logSecurityEvent({
    type,
    severity,
    userId: body.userId ?? undefined,
    ip: body.ip ?? undefined,
    userAgent: body.userAgent ?? undefined,
    path: body.path ?? undefined,
    metadata: body.metadata,
  });

  if ("skipped" in result) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
