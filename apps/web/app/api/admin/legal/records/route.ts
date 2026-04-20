import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { prisma } from "@/lib/db";
import { legalHubFlags } from "@/config/feature-flags";
import { mapPrismaLegalRecord } from "@/modules/legal/records/legal-record-import.service";
import type { LegalRecordValidationBundleV1, LegalRuleResult } from "@/modules/legal/records/legal-record.types";

export const dynamic = "force-dynamic";

type AdminRecordRow = ReturnType<typeof mapPrismaLegalRecord>;

function summarizeValidation(b: LegalRecordValidationBundleV1 | undefined) {
  if (!b?.validation) return null;
  return {
    isValid: b.validation.isValid,
    missingFields: b.validation.missingFields,
    inconsistentFields: b.validation.inconsistentFields,
    warnings: b.validation.warnings,
  };
}

function summarizeRules(b: LegalRecordValidationBundleV1 | undefined): LegalRuleResult[] {
  return Array.isArray(b?.rules) ? b.rules : [];
}

function flagsFromRecords(records: AdminRecordRow[]): string[] {
  const flags = new Set<string>();
  for (const r of records) {
    const b = r.validationSummary;
    if (b?.validation?.missingFields?.length) flags.add("missing_required_fields");
    if (b?.validation?.inconsistentFields?.length) flags.add("inconsistent_data");
    if (r.status === "needs_review") flags.add("needs_review");
    if (r.status === "rejected") flags.add("rejected");
    for (const rule of b?.rules ?? []) {
      if (rule.impact === "blocks_listing") flags.add("blocks_listing_rule");
      if (rule.severity === "critical") flags.add("critical_rule");
    }
  }
  return [...flags].sort();
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getGuestId().catch(() => null);
    const admin = await requireAdminUser(userId);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!legalHubFlags.legalHubAdminReviewV1 || !legalHubFlags.legalRecordImportV1) {
      return NextResponse.json({
        records: [],
        validationSummary: null,
        ruleSummary: [],
        flags: [],
        disabled: true,
      });
    }

    const url = req.nextUrl;
    const entityType = url.searchParams.get("entityType")?.trim();
    const entityId = url.searchParams.get("entityId")?.trim();

    const where =
      entityType && entityId ?
        { entityType, entityId }
      : entityType ?
        { entityType }
      : {};

    const rows = await prisma.legalRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        recordType: true,
        fileId: true,
        parsedData: true,
        validation: true,
        status: true,
        createdAt: true,
      },
    });

    const records = rows.map(mapPrismaLegalRecord);

    const validationSummary = records.map((r) => ({
      recordId: r.id,
      recordType: r.recordType,
      status: r.status,
      validation: summarizeValidation(r.validationSummary),
    }));

    const ruleSummary = records.map((r) => ({
      recordId: r.id,
      recordType: r.recordType,
      rules: summarizeRules(r.validationSummary),
    }));

    return NextResponse.json({
      records: records.map((r) => ({
        id: r.id,
        entityType: r.entityType,
        entityId: r.entityId,
        recordType: r.recordType,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        validationSummary: summarizeValidation(r.validationSummary),
        ruleSummary: summarizeRules(r.validationSummary),
      })),
      validationSummary,
      ruleSummary,
      flags: flagsFromRecords(records),
      disabled: false,
    });
  } catch {
    return NextResponse.json({ records: [], validationSummary: null, ruleSummary: [], flags: [], disabled: true }, { status: 200 });
  }
}
