/**
 * Admin audit panel assembly — read-only aggregates; no sensitive document payloads.
 */

import { prisma } from "@/lib/db";
import { buildEntityTimeline } from "@/modules/events/event-timeline.service";
import type { EventRecord } from "@/modules/events/event.types";
import { summarizeLegalIntelligence } from "@/modules/legal/legal-intelligence.service";
import type { LegalIntelligenceSummary } from "@/modules/legal/legal-intelligence.types";
import { brokerAiFlags, engineFlags } from "@/config/feature-flags";

export type AuditTimelineRow = {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorType: string;
  createdAt: string;
  summary: string;
};

export type AuditReasonTrailStep = {
  source: "timeline" | "legal_intel" | "preview" | "policy_stub";
  label: string;
  detail: string;
  sortKey: string;
};

export type AuditPanelPayload = {
  scopeType: "listing" | "legal_entity";
  listingId?: string;
  entityType?: string;
  entityId?: string;
  generatedAt: string;
  statusSummary: string;
  timeline: AuditTimelineRow[];
  legalSummary: LegalIntelligenceSummary | null;
  riskAnomalySummary: string;
  reasonTrail: AuditReasonTrailStep[];
  previewReasoningSummary: string | null;
  notes: string[];
};

function iso(d: Date): string {
  return d.toISOString();
}

function summarizeEvent(e: EventRecord): string {
  const meta = e.metadata && typeof e.metadata === "object" ? JSON.stringify(e.metadata).slice(0, 160) : "";
  return `${e.eventType}${meta ? ` · ${meta}` : ""}`;
}

function sortTrail(steps: AuditReasonTrailStep[]): AuditReasonTrailStep[] {
  return [...steps].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

/**
 * Scoped audit view for a marketplace listing id (FSBO).
 */
export async function buildListingAuditPanel(listingId: string): Promise<AuditPanelPayload> {
  const generatedAt = new Date().toISOString();
  const notes: string[] = [];
  try {
    const tl = await buildEntityTimeline("listing", listingId);
    const timeline: AuditTimelineRow[] = tl.events.slice(-80).map((e) => ({
      id: e.id,
      eventType: e.eventType,
      entityType: e.entityType,
      entityId: e.entityId,
      actorType: e.actorType,
      createdAt: iso(e.createdAt),
      summary: summarizeEvent(e),
    }));

    let legalSummary: LegalIntelligenceSummary | null = null;
    try {
      legalSummary = await summarizeLegalIntelligence({
        entityType: "fsbo_listing",
        entityId: listingId,
        actorType: "seller",
        workflowType: "fsbo_seller_documents",
      });
    } catch {
      notes.push("legal_intel_unavailable");
    }

    let previewReasoningSummary: string | null = null;
    if (engineFlags.autonomousMarketplaceV1) {
      try {
        const { autonomousMarketplaceEngine } = await import(
          "@/modules/autonomous-marketplace/execution/autonomous-marketplace.engine"
        );
        const preview = await autonomousMarketplaceEngine.previewForListing(listingId);
        previewReasoningSummary =
          preview.userSafeReasoningSummary ??
          preview.previewExplanation?.summary ??
          preview.explanation?.summary ??
          null;
      } catch {
        notes.push("preview_unavailable");
      }
    }

    let certificateOfLocationAudit: AuditPanelPayload["certificateOfLocationAudit"] = null;
    if (brokerAiFlags.brokerAiCertificateOfLocationV1) {
      try {
        const { buildCertificateOfLocationContextFromDb } = await import(
          "@/modules/broker-ai/certificate-of-location/certificate-of-location-context.service"
        );
        const { evaluateCertificateOfLocation } = await import(
          "@/modules/broker-ai/certificate-of-location/certificate-of-location-evaluator.service"
        );
        const ctx = await buildCertificateOfLocationContextFromDb({ listingId });
        const s = evaluateCertificateOfLocation(ctx);
        certificateOfLocationAudit = {
          status: s.status,
          readinessLevel: s.readinessLevel,
          riskLevel: s.riskLevel,
          blockingIssueCount: s.blockingIssues.length,
          blockingIssuesPreview: s.blockingIssues.slice(0, 6),
          warningsPreview: s.warnings.slice(0, 6),
          availabilityNotes: s.availabilityNotes.slice(0, 6),
        };
      } catch {
        notes.push("certificate_of_location_audit_unavailable");
      }
    }

    const reasonTrail = sortTrail([
      ...(certificateOfLocationAudit ?
        [
          {
            source: "certificate_of_location" as const,
            label: "Certificate of location readiness (platform helper)",
            detail: `status=${certificateOfLocationAudit.status}; readiness=${certificateOfLocationAudit.readinessLevel}; risk=${certificateOfLocationAudit.riskLevel}; blocking=${certificateOfLocationAudit.blockingIssueCount}`,
            sortKey: `0-${generatedAt}-cert`,
          },
        ]
      : []),
      ...(legalSummary ?
        [
          {
            source: "legal_intel" as const,
            label: "Legal intelligence snapshot",
            detail: legalSummary.freshnessNote,
            sortKey: `1-${legalSummary.builtAt}`,
          },
        ]
      : []),
      ...timeline.slice(-12).map(
        (row, i): AuditReasonTrailStep => ({
          source: "timeline",
          label: row.eventType,
          detail: row.summary,
          sortKey: `2-${row.createdAt}-${i}`,
        }),
      ),
    ]);

    const riskAnomalySummary =
      legalSummary ?
        `Signals: ${legalSummary.totalSignals}; warning=${legalSummary.countsBySeverity.warning}; critical=${legalSummary.countsBySeverity.critical}`
      : "No legal intelligence summary available for this listing scope.";

    const statusSummary =
      timeline.length > 0 ? `Timeline events recorded: ${timeline.length}` : "No timeline events indexed for this listing.";

    return {
      scopeType: "listing",
      listingId,
      generatedAt,
      statusSummary,
      timeline,
      legalSummary,
      riskAnomalySummary,
      reasonTrail,
      previewReasoningSummary,
      certificateOfLocationAudit,
      notes,
    };
  } catch {
    return {
      scopeType: "listing",
      listingId,
      generatedAt,
      statusSummary: "Audit panel assembly degraded — partial data omitted.",
      timeline: [],
      legalSummary: null,
      riskAnomalySummary: "Unavailable",
      reasonTrail: [],
      previewReasoningSummary: null,
      certificateOfLocationAudit: null,
      notes: [...notes, "audit_panel_failure"],
    };
  }
}

/**
 * Scoped audit view for legal intelligence entity keys (matches intelligence builders).
 */
export async function buildLegalEntityAuditPanel(entityType: string, entityId: string): Promise<AuditPanelPayload> {
  const generatedAt = new Date().toISOString();
  const notes: string[] = [];
  try {
    let legalSummary: LegalIntelligenceSummary | null = null;
    try {
      legalSummary = await summarizeLegalIntelligence({
        entityType,
        entityId,
        actorType: "system",
        workflowType: "audit_panel_scope",
      });
    } catch {
      notes.push("legal_intel_unavailable");
    }

    let rows: AuditTimelineRow[] = [];
    try {
      const tl = await buildEntityTimeline("workflow", entityId);
      rows = tl.events.slice(-80).map((e) => ({
        id: e.id,
        eventType: e.eventType,
        entityType: e.entityType,
        entityId: e.entityId,
        actorType: e.actorType,
        createdAt: iso(e.createdAt),
        summary: summarizeEvent(e),
      }));
    } catch {
      notes.push("timeline_unavailable");
    }

    let intelRows: AuditTimelineRow[] = [];
    try {
      const records = await prisma.legalIntelligenceRecord.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          signalType: true,
          severity: true,
          explanation: true,
          createdAt: true,
        },
      });
      intelRows = records.map((r) => ({
        id: r.id,
        eventType: `legal_intel_${r.signalType}`,
        entityType,
        entityId,
        actorType: "system",
        createdAt: iso(r.createdAt),
        summary: `${r.severity}: ${r.explanation.slice(0, 120)}`,
      }));
    } catch {
      notes.push("legal_intel_records_unavailable");
    }

    const timeline = [...intelRows, ...rows]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-80);

    const reasonTrail = sortTrail([
      ...(legalSummary ?
        [
          {
            source: "legal_intel" as const,
            label: "Legal intelligence snapshot",
            detail: legalSummary.freshnessNote,
            sortKey: `1-${legalSummary.builtAt}`,
          },
        ]
      : []),
      ...timeline.slice(-12).map(
        (row, i): AuditReasonTrailStep => ({
          source: "timeline",
          label: row.eventType,
          detail: row.summary,
          sortKey: `2-${row.createdAt}-${i}`,
        }),
      ),
    ]);

    const riskAnomalySummary =
      legalSummary ?
        `Signals: ${legalSummary.totalSignals}; warning=${legalSummary.countsBySeverity.warning}; critical=${legalSummary.countsBySeverity.critical}`
      : "No legal intelligence summary available for this entity scope.";

    return {
      scopeType: "legal_entity",
      entityType,
      entityId,
      generatedAt,
      statusSummary: `Scoped audit for ${entityType}:${entityId}`,
      timeline,
      legalSummary,
      riskAnomalySummary,
      reasonTrail,
      previewReasoningSummary: null,
      notes,
    };
  } catch {
    return {
      scopeType: "legal_entity",
      entityType,
      entityId,
      generatedAt,
      statusSummary: "Audit panel assembly degraded — partial data omitted.",
      timeline: [],
      legalSummary: null,
      riskAnomalySummary: "Unavailable",
      reasonTrail: [],
      previewReasoningSummary: null,
      notes: [...notes, "audit_panel_failure"],
    };
  }
}

export function buildAuditReasonTrail(params: {
  listingPanel?: AuditPanelPayload | null;
  legalPanel?: AuditPanelPayload | null;
}): AuditReasonTrailStep[] {
  try {
    const merged: AuditReasonTrailStep[] = [];
    if (params.listingPanel?.reasonTrail.length) merged.push(...params.listingPanel.reasonTrail);
    if (params.legalPanel?.reasonTrail.length) merged.push(...params.legalPanel.reasonTrail);
    return sortTrail(merged);
  } catch {
    return [];
  }
}
