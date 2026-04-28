import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import type { DemoRecordedEvent } from "@/lib/demo/demo-recorder";
import { demoRecorderPush } from "@/lib/demo/demo-recorder-store";
import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";

export const dynamic = "force-dynamic";

function validEvent(e: unknown): e is DemoRecordedEvent {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  if (o.type !== "CLICK" && o.type !== "NAVIGATION") return false;
  if (typeof o.path !== "string" || o.path.length > 512) return false;
  if (typeof o.timestamp !== "number") return false;
  return true;
}

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  if (!isInvestorDemoModeActive()) {
    return NextResponse.json({ ok: false, message: "Investor demo mode is not active" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const rec =
    typeof body === "object" && body !== null && "event" in body
      ? (body as { event?: unknown; sessionId?: unknown }).event
      : null;
  const sidRaw =
    typeof body === "object" && body !== null && "sessionId" in body
      ? (body as { sessionId?: unknown }).sessionId
      : undefined;
  const sessionId = typeof sidRaw === "string" && sidRaw.trim() ? sidRaw.trim().slice(0, 128) : "default";

  if (!validEvent(rec)) {
    return NextResponse.json({ ok: false, message: "Invalid event payload" }, { status: 400 });
  }

  const meta =
    rec.metadata && typeof rec.metadata === "object" && !Array.isArray(rec.metadata)
      ? (rec.metadata as Record<string, unknown>)
      : undefined;

  const sanitized: DemoRecordedEvent = {
    type: rec.type,
    path: rec.path,
    timestamp: rec.timestamp,
    metadata: stripSecrets(meta),
  };

  demoRecorderPush(sessionId, sanitized);
  return NextResponse.json({ ok: true });
}

function stripSecrets(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (/secret|password|token|authorization|cookie/i.test(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 240);
    else if (typeof v === "number" || typeof v === "boolean" || v === null) out[k] = v;
  }
  return out;
}
