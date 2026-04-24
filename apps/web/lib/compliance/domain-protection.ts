import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { SystemDomain } from "./entity-compliance-guard";
import { ComplianceDomainGuard } from "./compliance-domain-guard";

/**
 * PART G: API / SYSTEM ENFORCEMENT
 * Higher-level helper to protect API routes by domain.
 * Upgraded to use ComplianceDomainGuard for license and consent validation.
 */
export async function withDomainProtection(params: {
  domain: SystemDomain;
  action: string;
  entityId?: string;
  handler: (userId: string, entityId?: string) => Promise<Response>;
}) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Unified Compliance Check (Domain + License + Consent)
    const guard = await ComplianceDomainGuard.validate({
      userId,
      domain: params.domain,
      action: params.action,
      entityId: params.entityId,
    });

    if (!guard.allowed) {
      return NextResponse.json({ 
        error: "Regulatory compliance block", 
        reason: guard.reason,
        domain: params.domain 
      }, { status: 403 });
    }

    // 2. Execute Handler
    return await params.handler(userId, guard.entityId || undefined);
  } catch (error: any) {
    console.error(`[domain-protection] Error in ${params.domain}/${params.action}:`, error);
    return NextResponse.json({ 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}
