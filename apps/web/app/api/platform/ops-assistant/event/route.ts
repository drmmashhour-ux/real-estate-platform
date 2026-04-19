import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { platformImprovementFlags } from "@/config/feature-flags";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import {
  recordOpsAssistantActionCompleted,
  recordOpsAssistantCancelled,
  recordOpsAssistantConfirmed,
  recordOpsAssistantSuggestionClicked,
} from "@/modules/platform/ops-assistant/ops-assistant-monitoring.service";

export const dynamic = "force-dynamic";

const EVENTS = new Set(["click", "confirm", "cancel", "complete"]);

export async function POST(req: Request) {
  if (!platformImprovementFlags.platformImprovementReviewV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as {
    event?: unknown;
    suggestionId?: unknown;
    priorityId?: unknown;
  } | null;
  const event = typeof body?.event === "string" ? body.event : "";
  const suggestionId = typeof body?.suggestionId === "string" ? body.suggestionId : "";
  const priorityId = typeof body?.priorityId === "string" ? body.priorityId : "";
  if (!event || !suggestionId || !priorityId || !EVENTS.has(event)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  switch (event) {
    case "click":
      recordOpsAssistantSuggestionClicked(suggestionId, priorityId);
      break;
    case "confirm":
      recordOpsAssistantConfirmed(suggestionId, priorityId);
      break;
    case "cancel":
      recordOpsAssistantCancelled(suggestionId, priorityId);
      break;
    case "complete":
      recordOpsAssistantActionCompleted(suggestionId, priorityId);
      break;
    default:
      break;
  }

  return NextResponse.json({ ok: true as const });
}
