import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { complianceFlags } from "@/config/feature-flags";
import { validateAllContractClauses } from "@/lib/compliance/oaciq/clause-compliance/clause-db.service";
import { logClauseComplianceAudit } from "@/lib/compliance/oaciq/clause-compliance/audit";
import {
  canAccessContract,
  getContractForAccess,
  resolveListingOwnerId,
} from "@/modules/contracts/services/access";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** POST /api/contracts/:id/validate-all — run master validator on all attached clauses. */
export async function POST(req: Request, context: Params) {
  if (!complianceFlags.oaciqClauseComplianceEngineV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id: contractId } = await context.params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let persistRuns = true;
  let aiFlag = false;
  const raw = await req.text();
  if (raw.trim()) {
    let body: { persist?: boolean; aiFlag?: boolean };
    try {
      body = JSON.parse(raw) as { persist?: boolean; aiFlag?: boolean };
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (body.persist === false) persistRuns = false;
    if (body.aiFlag === true) aiFlag = true;
  }

  const c = await getContractForAccess(contractId);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const listingOwnerId = await resolveListingOwnerId(c);
  if (!canAccessContract(userId, user.role, c, listingOwnerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await validateAllContractClauses({
    contractId,
    validatedByUserId: userId,
    persistRuns,
    aiFlag,
  });

  const ownerType = c.tenantId ? "agency" : "solo_broker";
  const ownerId = c.tenantId ?? c.userId;
  void logClauseComplianceAudit({
    ownerType,
    ownerId,
    actorId: userId,
    contractId,
    dealId: c.dealId ?? null,
    event: "clause_validated",
    summary: result.allValid ? "All contract clauses passed structural validation" : "One or more clauses failed validation",
    details: {
      allValid: result.allValid,
      clauseCount: result.clauseResults.length,
      enforcement: result.enforcement,
    },
    aiAssisted: false,
  }).catch(() => null);

  return NextResponse.json({
    valid: result.allValid,
    errors: result.clauseResults.flatMap((r) => (r.validation.valid ? [] : r.validation.errors)),
    ai_flags: result.clauseResults.flatMap((r) => r.validation.ai_flags),
    result,
  });
}
