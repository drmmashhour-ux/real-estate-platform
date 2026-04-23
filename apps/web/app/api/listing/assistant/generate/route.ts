import { NextResponse } from "next/server";

import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { listingAssistantGenerateService } from "@/modules/listing-assistant/listing-assistant.service";
import type { ListingPropertyPartial } from "@/modules/listing-assistant/listing-assistant.types";
import { evaluateListingAssistantAlerts } from "@/modules/listing-assistant/listing-assistant-alerts.service";
import { computeListingReadiness } from "@/modules/listing-assistant/listing-readiness.service";
import { recordListingAssistantGeneration } from "@/modules/listing-assistant/listing-assistant.analytics";
import { snapshotFromGeneratedContent } from "@/modules/listing-assistant/listing-version.types";
import {
  ensureOriginalVersionRecord,
  recordListingAssistantVersion,
} from "@/modules/listing-assistant/listing-version.service";
import { logListingAssistant } from "@/modules/listing-assistant/listing-assistant.log";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

/** POST — draft listing content + compliance hints. Does not persist or syndicate. */
export async function POST(request: Request) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : undefined;
  if (listingId && !(await canAccessCrmListingCompliance(gate.session.id, listingId))) {
    logListingAssistant("generate_denied", { listingId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const partial =
    typeof body.partial === "object" && body.partial !== null ? (body.partial as ListingPropertyPartial) : {};
  const language = typeof body.language === "string" ? body.language : undefined;

  try {
    const bundle = await listingAssistantGenerateService({
      listingId: listingId ?? null,
      partial,
      language,
    });

    bundle.readiness = computeListingReadiness({
      content: bundle.content,
      compliance: bundle.compliance,
      partial,
      pricing: null,
    });
    bundle.alerts = evaluateListingAssistantAlerts({
      listingId,
      snapshot: snapshotFromGeneratedContent(bundle.content),
      pricing: null,
    }).map((a) => ({
      id: a.id,
      severity: a.severity,
      title: a.title,
      detail: a.detail,
    }));

    if (listingId) {
      await ensureOriginalVersionRecord({ listingId, actorUserId: gate.session.id });
      await recordListingAssistantVersion({
        listingId,
        phase: "AI_GENERATED",
        content: snapshotFromGeneratedContent(bundle.content),
        source: "AI_ASSISTANT",
        actorUserId: gate.session.id,
      });
    }

    logListingAssistant("generate_ok", {
      listingId: listingId ?? null,
      riskLevel: bundle.compliance.riskLevel,
      language: bundle.language,
      listingScore: bundle.listingPerformance.listingScore,
    });
    await recordListingAssistantGeneration({
      userId: gate.session.id,
      listingId: listingId ?? null,
      language: bundle.language,
      listingScore: bundle.listingPerformance.listingScore,
      complianceRisk: bundle.compliance.riskLevel,
    });
    return NextResponse.json(bundle);
  } catch (e) {
    logListingAssistant("generate_error", { err: e instanceof Error ? e.message : "unknown" });
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
