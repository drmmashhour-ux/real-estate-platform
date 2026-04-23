import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { complianceFlags } from "@/config/feature-flags";
import { addClauseToContract } from "@/lib/compliance/oaciq/clause-compliance/clause-db.service";
import { logClauseComplianceAudit } from "@/lib/compliance/oaciq/clause-compliance/audit";
import {
  canAccessContract,
  getContractForAccess,
  resolveListingOwnerId,
} from "@/modules/contracts/services/access";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** POST /api/contracts/:id/add-clause */
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

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const c = await getContractForAccess(contractId);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const listingOwnerId = await resolveListingOwnerId(c);
  if (!canAccessContract(userId, user.role, c, listingOwnerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const created = await addClauseToContract({
      contractId,
      libraryClauseId: typeof body.libraryClauseId === "string" ? body.libraryClauseId : undefined,
      code: typeof body.code === "string" ? body.code : undefined,
      customText: typeof body.customText === "string" ? body.customText : null,
      actorDefined: body.actorDefined === true,
      deadlineDefined: body.deadlineDefined === true,
      noticeDefined: body.noticeDefined === true,
      consequenceDefined: body.consequenceDefined === true,
    });

    const ownerType = c.tenantId ? "agency" : "solo_broker";
    const ownerId = c.tenantId ?? c.userId;
    void logClauseComplianceAudit({
      ownerType,
      ownerId,
      actorId: userId,
      contractId,
      dealId: c.dealId ?? null,
      event: "clause_created",
      summary: `Contract clause added: ${created.libraryClause.code}`,
      details: { contractClauseId: created.id, libraryCode: created.libraryClause.code },
      aiAssisted: false,
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      contractClause: {
        id: created.id,
        libraryClauseId: created.libraryClauseId,
        code: created.libraryClause.code,
        validated: created.validated,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "CLAUSE_LIBRARY_NOT_FOUND") {
      return NextResponse.json({ error: "Clause library not found" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
