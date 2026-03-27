import { auditPackageToCsvSummary, auditPackageToJson } from "@/lib/trustgraph/infrastructure/services/auditPackageService";
import type { AuditPackageManifestDto } from "@/lib/trustgraph/domain/audit";

export function exportAuditPackageJson(manifest: AuditPackageManifestDto): string {
  return auditPackageToJson(manifest);
}

export function exportAuditPackageCsv(manifest: AuditPackageManifestDto): string {
  return auditPackageToCsvSummary(manifest);
}
