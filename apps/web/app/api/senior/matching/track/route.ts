import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { getGuestId } from "@/lib/auth/session";
import { recordMatchingEvent, type MatchingEventType } from "@/modules/senior-living/matching-events.service";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["VIEW", "CLICK", "LEAD", "VISIT", "CONVERTED"]);

function normalizeEvent(t: string): MatchingEventType | null {
  const u = t.toUpperCase().slice(0, 24);
  return ALLOWED.has(u) ? (u as MatchingEventType) : null;
}

/**
 * Record matching funnel events (VIEW, CLICK, …). Accepts one event or a batch.
 * Authenticated users get userId attached when available.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = await getGuestId();

  type One = { eventType: string; residenceId: string; scoreAtTime?: number | null };
  const singles: One[] = [];

  if (Array.isArray(body.events)) {
    for (const raw of body.events as Record<string, unknown>[]) {
      const residenceId = typeof raw?.residenceId === "string" ? raw.residenceId.trim() : "";
      const rawType = typeof raw?.eventType === "string" ? raw.eventType : "";
      const scoreAtTime = typeof raw?.scoreAtTime === "number" ? raw.scoreAtTime : null;
      const ev = normalizeEvent(rawType);
      if (!residenceId || !ev) continue;
      singles.push({ eventType: ev, residenceId, scoreAtTime });
    }
  } else {
    const residenceId = typeof body.residenceId === "string" ? body.residenceId.trim() : "";
    const rawType = typeof body.eventType === "string" ? body.eventType : "";
    const scoreAtTime = typeof body.scoreAtTime === "number" ? body.scoreAtTime : null;
    const ev = normalizeEvent(rawType);
    if (!residenceId || !ev) {
      return NextResponse.json({ error: "residenceId and eventType required" }, { status: 400 });
    }
    singles.push({ eventType: ev, residenceId, scoreAtTime });
  }

  if (singles.length === 0) {
    return NextResponse.json({ ok: true, recorded: 0 });
  }

  try {
    for (const e of singles) {
      await recordMatchingEvent({
        userId,
        residenceId: e.residenceId,
        eventType: e.eventType,
        scoreAtTime: e.scoreAtTime ?? null,
      });
    }
    return NextResponse.json({ ok: true, recorded: singles.length });
  } catch (err) {
    logError("[api.senior.matching.track]", { error: err });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
