import { generateAuditPackageRecord } from "@/lib/trustgraph/infrastructure/services/auditPackageService";

export async function generateAuditPackage(args: Parameters<typeof generateAuditPackageRecord>[0]) {
  return generateAuditPackageRecord(args);
}
