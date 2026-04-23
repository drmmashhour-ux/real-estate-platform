import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { complianceFlags } from "@/config/feature-flags";
import {
  getClauseLibraryEntry,
  validateClauseBatchSync,
} from "@/lib/compliance/oaciq/clause-compliance";
import type { ClauseInstance } from "@/lib/compliance/oaciq/clause-compliance/types";
import {
  validateClauseAgainstLibrary,
} from "@/lib/compliance/oaciq/clause-compliance/clause-db.service";
import {
  canAccessContract,
  getContractForAccess,
  resolveListingOwnerId,
} from "@/modules/contracts/services/access";

export const dynamic = "force-dynamic";

/** POST /api/clauses/validate — DB-backed instance, preview, or structured clauseInstances batch. */
export async function POST(req: Request) {
  if (!complianceFlags.oaciqClauseComplianceEngineV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

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

  if (Array.isArray(body.clauseInstances)) {
    const batch = validateClauseBatchSync(body.clauseInstances as ClauseInstance[]);
    return NextResponse.json({
      valid: batch.valid,
      errors: batch.issues.filter((i) => i.severity === "blocking").map((i) => i.message),
      ai_flags: batch.suggestions,
      clauseCompliance: batch,
    });
  }

  if (typeof body.contractClauseId === "string" && body.contractClauseId.trim()) {
    const row = await prisma.contractClause.findUnique({
      where: { id: body.contractClauseId.trim() },
      include: { libraryClause: true },
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const c = await getContractForAccess(row.contractId);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const listingOwnerId = await resolveListingOwnerId(c);
    if (!canAccessContract(userId, user.role, c, listingOwnerId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const v = validateClauseAgainstLibrary(row, row.libraryClause);
    return NextResponse.json({
      valid: v.valid,
      errors: v.errors,
      ai_flags: v.ai_flags,
    });
  }

  const preview = body.preview as Record<string, unknown> | undefined;
  if (preview && typeof preview.libraryClauseId === "string") {
    const lib = await prisma.clausesLibrary.findFirst({
      where: { id: preview.libraryClauseId.trim(), active: true },
    });
    if (!lib) {
      return NextResponse.json({ error: "Clause library not found" }, { status: 404 });
    }
    const v = validateClauseAgainstLibrary(
      {
        customText: typeof preview.customText === "string" ? preview.customText : null,
        actorDefined: preview.actorDefined === true,
        deadlineDefined: preview.deadlineDefined === true,
        noticeDefined: preview.noticeDefined === true,
        consequenceDefined: preview.consequenceDefined === true,
      },
      lib,
    );
    return NextResponse.json({
      valid: v.valid,
      errors: v.errors,
      ai_flags: v.ai_flags,
    });
  }

  if (preview && typeof preview.clauseId === "string") {
    const entry = getClauseLibraryEntry(preview.clauseId.trim());
    if (!entry) {
      return NextResponse.json({ error: "Unknown clauseId" }, { status: 400 });
    }
    const params: Record<string, string> = {};
    if (preview.params && typeof preview.params === "object") {
      for (const [k, val] of Object.entries(preview.params as Record<string, unknown>)) {
        params[k] = val == null ? "" : String(val);
      }
    }
    const batch = validateClauseBatchSync([
      {
        clauseId: entry.id,
        params,
        narrativeFr: typeof preview.narrativeFr === "string" ? preview.narrativeFr : undefined,
      },
    ]);
    return NextResponse.json({
      valid: batch.valid,
      errors: batch.issues.filter((i) => i.severity === "blocking").map((i) => i.message),
      ai_flags: batch.suggestions,
      clauseCompliance: batch,
    });
  }

  return NextResponse.json(
    { error: "Provide clauseInstances[], contractClauseId, or preview{ libraryClauseId | clauseId }" },
    { status: 400 },
  );
}
