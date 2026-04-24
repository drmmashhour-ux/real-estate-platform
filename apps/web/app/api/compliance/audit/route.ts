import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { ComplianceAuditService } from "@/lib/compliance/compliance-audit.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "Missing entityType or entityId" }, { status: 400 });
  }

  return withDomainProtection({
    domain: "PLATFORM",
    action: "VIEW_ANALYTICS",
    handler: async (userId) => {
      // Admin only for full audit logs usually, but let's allow it for now for demo/transparency
      const logs = await ComplianceAuditService.getEntityAuditLogs(entityType as any, entityId);
      return NextResponse.json({ ok: true, logs });
    }
  });
}
