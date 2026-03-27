import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { getPhase8PlatformConfig } from "@/lib/trustgraph/config/phase8-platform";
import type { AuditPackageManifestDto } from "@/lib/trustgraph/domain/audit";
import { isTrustGraphAuditExportsEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import { canonicalStringify, sha256Hex } from "@/lib/trustgraph/infrastructure/services/auditSerializationService";

export async function generateAuditPackageRecord(args: {
  workspaceId: string;
  createdBy: string;
}): Promise<{ packageId: string; manifest: AuditPackageManifestDto; hash: string } | { skipped: true }> {
  if (!isTrustGraphEnabled() || !isTrustGraphAuditExportsEnabled()) return { skipped: true };

  const cfg = getPhase8PlatformConfig();
  const links = await prisma.trustgraphComplianceWorkspaceEntityLink.findMany({
    where: { workspaceId: args.workspaceId, entityType: "LISTING" },
    take: 50,
  });
  const listingIds = links.map((l) => l.entityId);

  const cases = await prisma.verificationCase.findMany({
    where: { entityType: "LISTING", entityId: { in: listingIds.length ? listingIds : ["__none__"] } },
    take: 100,
    orderBy: { updatedAt: "desc" },
    include: {
      ruleResults: { take: 20 },
      reviewActions: { take: 20 },
      signals: { take: 20 },
    },
  });

  const caseHistory = cases.map((c) => ({
    id: c.id,
    entityType: c.entityType,
    entityId: c.entityId,
    status: c.status,
    trustLevel: c.trustLevel,
    readinessLevel: c.readinessLevel,
    updatedAt: c.updatedAt.toISOString(),
  }));

  const ruleResultsSample = cases.flatMap((c) =>
    c.ruleResults.map((r) => ({
      caseId: c.id,
      ruleCode: r.ruleCode,
      passed: r.passed,
      scoreDelta: r.scoreDelta,
    }))
  );

  const reviewActionsSample = cases.flatMap((c) =>
    c.reviewActions.map((a) => ({
      caseId: c.id,
      actionType: a.actionType,
      createdAt: a.createdAt.toISOString(),
    }))
  );

  const manifest: AuditPackageManifestDto = {
    exportVersion: cfg.audit.exportVersion,
    generatedAt: new Date().toISOString(),
    workspaceId: args.workspaceId,
    packageHash: "",
    sections: {
      caseHistory,
      ruleResultsSample,
      reviewActionsSample,
    },
  };

  const hash = sha256Hex(canonicalStringify(manifest.sections));
  manifest.packageHash = hash;

  const row = await prisma.trustgraphAuditPackage.create({
    data: {
      workspaceId: args.workspaceId,
      packageHash: hash,
      manifest: manifest as object,
      createdBy: args.createdBy,
    },
    select: { id: true },
  });

  void recordPlatformEvent({
    eventType: "trustgraph_audit_package_generated",
    sourceModule: "trustgraph",
    entityType: "AUDIT_PACKAGE",
    entityId: row.id,
    payload: { workspaceId: args.workspaceId, hashPrefix: hash.slice(0, 12) },
  }).catch(() => {});

  return { packageId: row.id, manifest, hash };
}

export function auditPackageToJson(manifest: AuditPackageManifestDto): string {
  return JSON.stringify(manifest, null, 2);
}

export function auditPackageToCsvSummary(manifest: AuditPackageManifestDto): string {
  const rows = manifest.sections.caseHistory.map(
    (c) => `${c.id},${c.entityType},${c.entityId},${c.status},${c.trustLevel ?? ""},${c.readinessLevel ?? ""}`
  );
  return ["case_id,entity_type,entity_id,status,trust,readiness", ...rows].join("\n");
}
