import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { eventTimelineFlags } from "@/config/feature-flags";
import { buildEntityTimeline } from "@/modules/events/event-timeline.service";
import type { EventEntityType } from "@/modules/events/event.types";

export const dynamic = "force-dynamic";

const ALLOWED_ENTITY: Set<string> = new Set([
  "document",
  "workflow",
  "listing",
  "user",
  "review",
  "verification",
]);

export async function GET(request: Request) {
  const viewer = await getGuestId();
  if (!viewer) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const admin = await requireAdminUser(viewer);
  if (!admin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
  }
  if (!ALLOWED_ENTITY.has(entityType)) {
    return NextResponse.json({ error: "Unsupported entityType" }, { status: 400 });
  }

  if (!eventTimelineFlags.eventTimelineV1) {
    return NextResponse.json({
      disabled: true,
      timeline: { events: [], byType: {}, orderedIds: [] },
      summary: { count: 0 },
    });
  }

  try {
    const tl = await buildEntityTimeline(entityType as EventEntityType, entityId);
    const safeEvents = tl.events.map((e) => ({
      id: e.id,
      entityType: e.entityType,
      entityId: e.entityId,
      eventType: e.eventType,
      actorType: e.actorType,
      metadata: sanitizeMeta(e.metadata),
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({
      disabled: false,
      timeline: { ...tl, events: safeEvents },
      summary: {
        count: tl.events.length,
        byType: tl.byType,
      },
    });
  } catch {
    return NextResponse.json({
      disabled: true,
      timeline: { events: [], byType: {}, orderedIds: [] },
      summary: { count: 0 },
    });
  }
}

function sanitizeMeta(meta: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!meta || typeof meta !== "object") return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean" ||
      v === null
    ) {
      const keyLower = k.toLowerCase();
      if (keyLower.includes("reason") || keyLower.includes("snippet")) {
        out[k] =
          typeof v === "string" ? (v.length > 120 ? `${v.slice(0, 120)}…` : v) : v;
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}
