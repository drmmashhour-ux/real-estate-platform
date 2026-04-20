/**
 * Legal record import — metadata + deterministic parse / validate / rules; no raw file bytes in DB.
 */

import type { LegalRecord as PrismaLegalRecord } from "@prisma/client";
import { prisma } from "@/lib/db";
import { legalHubFlags, legalIntelligenceFlags } from "@/config/feature-flags";
import { recordEventSafe } from "@/modules/events/event-helpers";
import { recordEvent } from "@/modules/events/event.service";
import type {
  LegalRecordStatus,
  LegalRecordType,
  LegalRecordValidationBundleV1,
  LegalRuleResult,
  LegalValidationResult,
} from "./legal-record.types";
import { parseLegalRecord } from "./legal-record-parser.service";
import { validateLegalRecord } from "./legal-record-validation.service";
import { evaluateLegalRules } from "@/modules/legal/rules/legal-rule-engine.service";

function bundleFrom(
  validation: LegalValidationResult,
  rules: LegalRuleResult[],
): LegalRecordValidationBundleV1 {
  return { version: 1, validation, rules };
}

/** Deterministic terminal status — safe fallbacks only. */
export function finalizeLegalRecordStatus(
  validation: LegalValidationResult,
  rules: LegalRuleResult[],
): LegalRecordStatus {
  try {
    const blocking = rules.some((r) => r.impact === "blocks_listing");
    const critical = rules.some((r) => r.severity === "critical");
    const requiresReview = rules.some((r) => r.impact === "requires_review");

    if (blocking && (!validation.isValid || critical)) return "rejected";

    if (!validation.isValid || validation.inconsistentFields.length > 0 || critical || requiresReview) {
      return "needs_review";
    }

    if (validation.warnings.length > 0) return "needs_review";

    return "validated";
  } catch {
    return "needs_review";
  }
}

export type ImportLegalRecordParams = {
  entityType: string;
  entityId: string;
  recordType: LegalRecordType;
  fileId: string;
  /** Structured fields when already extracted server-side (deterministic JSON). */
  structuredInput?: Record<string, unknown> | null;
  actorType?: string;
};

export type ImportLegalRecordResult =
  | { ok: true; id: string; status: LegalRecordStatus }
  | { ok: false; error: string };

/**
 * Creates a legal record row and runs the gated parse → validate → rules pipeline.
 */
export async function importLegalRecord(params: ImportLegalRecordParams): Promise<ImportLegalRecordResult> {
  try {
    if (!params.entityType?.trim()) return { ok: false, error: "entityType_required" };
    if (!params.entityId?.trim()) return { ok: false, error: "entityId_required" };
    if (!params.fileId?.trim()) return { ok: false, error: "fileId_required" };

    const actorType = params.actorType?.trim() || "system";

    const row = await prisma.legalRecord.create({
      data: {
        entityType: params.entityType.trim(),
        entityId: params.entityId.trim(),
        recordType: params.recordType,
        fileId: params.fileId.trim(),
        status: "uploaded",
      },
    });

    await recordEventSafe(async () =>
      recordEvent({
        entityType: "legal_record",
        entityId: row.id,
        eventType: "legal_record_uploaded",
        actorType,
        metadata: {
          recordType: params.recordType,
          scopeEntityType: params.entityType,
          scopeEntityId: params.entityId,
        },
      }),
    );

    const pipelineEnabled = legalHubFlags.legalRecordImportV1 && legalHubFlags.legalHubV1;
    if (!pipelineEnabled) {
      return { ok: true, id: row.id, status: "uploaded" };
    }

    const parsedData = parseLegalRecord({
      recordType: params.recordType,
      structuredInput: params.structuredInput ?? null,
    });

    await prisma.legalRecord.update({
      where: { id: row.id },
      data: {
        parsedData: parsedData as object,
        status: "parsed",
      },
    });

    await recordEventSafe(async () =>
      recordEvent({
        entityType: "legal_record",
        entityId: row.id,
        eventType: "legal_record_parsed",
        actorType,
        metadata: { recordType: params.recordType },
      }),
    );

    const validation = validateLegalRecord({
      recordType: params.recordType,
      parsedData,
    });

    const rulesEnabled = legalHubFlags.legalRuleEngineV1 && legalIntelligenceFlags.legalIntelligenceV1;
    const rules = rulesEnabled ?
        evaluateLegalRules({
          recordType: params.recordType,
          parsedData,
          validation,
        })
      : [];

    const bundle = bundleFrom(validation, rules);
    const status = finalizeLegalRecordStatus(validation, rules);

    await prisma.legalRecord.update({
      where: { id: row.id },
      data: {
        validation: bundle as object,
        status,
      },
    });

    await recordEventSafe(async () =>
      recordEvent({
        entityType: "legal_record",
        entityId: row.id,
        eventType: "legal_record_validated",
        actorType,
        metadata: {
          recordType: params.recordType,
          isValid: validation.isValid,
          status,
        },
      }),
    );

    if (status === "needs_review") {
      await recordEventSafe(async () =>
        recordEvent({
          entityType: "legal_record",
          entityId: row.id,
          eventType: "legal_record_flagged",
          actorType,
          metadata: { recordType: params.recordType },
        }),
      );
    }
    if (status === "rejected") {
      await recordEventSafe(async () =>
        recordEvent({
          entityType: "legal_record",
          entityId: row.id,
          eventType: "legal_record_rejected",
          actorType,
          metadata: { recordType: params.recordType },
        }),
      );
    }

    return { ok: true, id: row.id, status };
  } catch {
    return { ok: false, error: "import_failed" };
  }
}

export type AttachFileParams = { recordId: string; fileId: string; actorType?: string };

export async function attachFileToLegalRecord(params: AttachFileParams): Promise<ImportLegalRecordResult> {
  try {
    if (!params.recordId?.trim()) return { ok: false, error: "recordId_required" };
    if (!params.fileId?.trim()) return { ok: false, error: "fileId_required" };
    const actorType = params.actorType?.trim() || "system";
    await prisma.legalRecord.update({
      where: { id: params.recordId.trim() },
      data: { fileId: params.fileId.trim() },
    });
    await recordEventSafe(async () =>
      recordEvent({
        entityType: "legal_record",
        entityId: params.recordId.trim(),
        eventType: "legal_record_uploaded",
        actorType,
        metadata: { phase: "attach_file" },
      }),
    );
    return { ok: true, id: params.recordId.trim(), status: "uploaded" };
  } catch {
    return { ok: false, error: "attach_failed" };
  }
}

export type MarkUploadedParams = { recordId: string; actorType?: string };

export async function markRecordUploaded(params: MarkUploadedParams): Promise<ImportLegalRecordResult> {
  try {
    if (!params.recordId?.trim()) return { ok: false, error: "recordId_required" };
    const actorType = params.actorType?.trim() || "system";
    await prisma.legalRecord.update({
      where: { id: params.recordId.trim() },
      data: { status: "uploaded" },
    });
    await recordEventSafe(async () =>
      recordEvent({
        entityType: "legal_record",
        entityId: params.recordId.trim(),
        eventType: "legal_record_uploaded",
        actorType,
        metadata: { phase: "mark_uploaded" },
      }),
    );
    return { ok: true, id: params.recordId.trim(), status: "uploaded" };
  } catch {
    return { ok: false, error: "mark_failed" };
  }
}

export function mapPrismaLegalRecord(row: PrismaLegalRecord): {
  id: string;
  entityType: string;
  entityId: string;
  recordType: LegalRecordType;
  fileId: string;
  parsedData?: Record<string, unknown>;
  validationSummary?: LegalRecordValidationBundleV1;
  status: LegalRecordStatus;
  createdAt: Date;
} {
  const rt = row.recordType as LegalRecordType;
  const st = row.status as LegalRecordStatus;
  let validationSummary: LegalRecordValidationBundleV1 | undefined;
  if (row.validation && typeof row.validation === "object") {
    const v = row.validation as LegalRecordValidationBundleV1;
    if (v && v.version === 1 && v.validation && Array.isArray(v.rules)) validationSummary = v;
  }
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    recordType: rt,
    fileId: row.fileId,
    parsedData:
      row.parsedData && typeof row.parsedData === "object" ? (row.parsedData as Record<string, unknown>) : undefined,
    validationSummary,
    status: st,
    createdAt: row.createdAt,
  };
}
