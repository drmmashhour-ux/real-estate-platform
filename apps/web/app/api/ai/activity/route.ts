import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { refreshUserAiProfile } from "@/lib/ai/behavior-scoring";
import { recordBnhubActivityToInternalCrm } from "@/lib/crm/internal-crm-telemetry";

const ALLOWED = new Set([
  "search",
  "listing_view",
  "listing_save",
  "listing_contact_click",
  "listing_gallery_nav",
  "message_sent",
  "session_heartbeat",
  "repeat_visit",
  "immo_ai_chat_started",
  "immo_ai_qualification_complete",
  "immo_ai_contact_captured",
  "immo_ai_hot_lead",
  "funnel_listing_card_click",
  "funnel_broker_handoff_logged",
]);

/**
 * POST /api/ai/activity — log behavior for lead scoring (authenticated users only).
 * Privacy: never public; no PII in query params.
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = typeof body.eventType === "string" ? body.eventType : "";
  if (!ALLOWED.has(eventType)) {
    return Response.json({ error: "Invalid eventType" }, { status: 400 });
  }

  const searchQuery =
    typeof body.searchQuery === "string" ? body.searchQuery.slice(0, 500) : undefined;
  const listingId = typeof body.listingId === "string" ? body.listingId : undefined;
  const projectId = typeof body.projectId === "string" ? body.projectId : undefined;
  const durationSeconds =
    typeof body.durationSeconds === "number" && Number.isFinite(body.durationSeconds)
      ? Math.min(7200, Math.max(0, Math.floor(body.durationSeconds)))
      : undefined;

  await prisma.aiUserActivityLog.create({
    data: {
      userId,
      eventType,
      listingId,
      projectId,
      searchQuery,
      durationSeconds,
      metadata: typeof body.metadata === "object" && body.metadata ? (body.metadata as object) : undefined,
    },
  });

  void recordBnhubActivityToInternalCrm({
    userId,
    eventType,
    listingId,
    durationSeconds,
    metadata:
      typeof body.metadata === "object" && body.metadata && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : undefined,
  }).catch(() => {});

  await refreshUserAiProfile(userId).catch(() => {});

  return Response.json({ ok: true });
}
