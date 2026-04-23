import { NextResponse } from "next/server";

import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { logListingAssistant } from "@/modules/listing-assistant/listing-assistant.log";
import { saveListingAssistantDraftToCrm } from "@/modules/listing-assistant/listing-assistant-save.service";
import type { ListingAssistantContentSnapshot } from "@/modules/listing-assistant/listing-version.types";
import {
  ensureOriginalVersionRecord,
  recordListingAssistantVersion,
} from "@/modules/listing-assistant/listing-version.service";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

function parseSnapshot(body: Record<string, unknown>): ListingAssistantContentSnapshot | null {
  const content = body.content;
  if (!content || typeof content !== "object") return null;
  const o = content as Record<string, unknown>;
  return {
    title: typeof o.title === "string" ? o.title : "",
    description: typeof o.description === "string" ? o.description : "",
    propertyHighlights: Array.isArray(o.propertyHighlights) ? (o.propertyHighlights as string[]) : [],
    language: o.language === "fr" || o.language === "ar" ? o.language : "en",
    amenities: Array.isArray(o.amenities) ? (o.amenities as string[]) : undefined,
    zoningNotes: typeof o.zoningNotes === "string" ? o.zoningNotes : undefined,
  };
}

/** POST — persist assistant output into CRM listing draft JSON only (no publish / syndication). */
export async function POST(request: Request) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  if (!(await canAccessCrmListingCompliance(gate.session.id, listingId))) {
    logListingAssistant("save_draft_denied", { listingId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = parseSnapshot(body);
  if (!snapshot) {
    return NextResponse.json({ error: "content object required" }, { status: 400 });
  }

  const brokerEdited = Boolean(body.brokerEdited);

  try {
    await ensureOriginalVersionRecord({ listingId, actorUserId: gate.session.id });
    if (brokerEdited) {
      await recordListingAssistantVersion({
        listingId,
        phase: "BROKER_EDITED",
        content: snapshot,
        source: "BROKER_MANUAL",
        actorUserId: gate.session.id,
      });
    }
    await saveListingAssistantDraftToCrm({
      listingId,
      content: snapshot,
      actorUserId: gate.session.id,
      source: brokerEdited ? "BROKER_MANUAL" : "AI_ASSISTANT",
    });
    logListingAssistant("save_draft_ok", { listingId, brokerEdited });
    return NextResponse.json({
      ok: true,
      listingId,
      savedSource: brokerEdited ? "BROKER_MANUAL" : "AI_ASSISTANT",
    });
  } catch (e) {
    logListingAssistant("save_draft_error", { err: e instanceof Error ? e.message : "unknown" });
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
