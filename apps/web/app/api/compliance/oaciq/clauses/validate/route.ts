import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { requireUser } from "@/lib/auth/require-user";
import { complianceFlags } from "@/config/feature-flags";
import type { ClauseInstance } from "@/lib/compliance/oaciq/clause-compliance/types";
import { validateClauseBatch } from "@/lib/compliance/oaciq/clause-compliance/validate-engine";
import { logClauseComplianceAudit } from "@/lib/compliance/oaciq/clause-compliance/audit";

export const dynamic = "force-dynamic";

function parseInstances(raw: unknown): ClauseInstance[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ClauseInstance[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const o = item as Record<string, unknown>;
    if (typeof o.clauseId !== "string") return null;
    if (!o.params || typeof o.params !== "object") return null;
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(o.params as Record<string, unknown>)) {
      if (v === null || v === undefined) params[k] = "";
      else if (typeof v === "string") params[k] = v;
      else params[k] = String(v);
    }
    out.push({
      clauseId: o.clauseId.trim(),
      params,
      narrativeFr: typeof o.narrativeFr === "string" ? o.narrativeFr : undefined,
      narrativeEn: typeof o.narrativeEn === "string" ? o.narrativeEn : undefined,
    });
  }
  return out;
}

/** POST — structured OACIQ clause validation (broker/admin). */
export async function POST(req: Request) {
  if (!complianceFlags.oaciqClauseComplianceEngineV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER && auth.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const instances = parseInstances(body.clauseInstances);
  if (!instances || instances.length === 0) {
    return NextResponse.json({ error: "clauseInstances[] required" }, { status: 400 });
  }

  const withAi = body.withAiSuggestions === true;
  const result = await validateClauseBatch({ instances, withAiSuggestions: withAi });

  const persist = body.audit === true && typeof body.ownerType === "string" && typeof body.ownerId === "string";
  if (persist) {
    void logClauseComplianceAudit({
      ownerType: body.ownerType as string,
      ownerId: body.ownerId as string,
      actorId: auth.user.id,
      contractId: typeof body.contractId === "string" ? body.contractId : null,
      dealId: typeof body.dealId === "string" ? body.dealId : null,
      event: "clause_validated",
      summary: result.valid ? "Clause batch valid (structural)" : "Clause batch blocked (structural/ambiguity)",
      details: { issueCount: result.issues.length, enforcement: result.enforcement },
      aiAssisted: result.aiAssistedSuggestions,
    }).catch(() => null);
  }

  return NextResponse.json({ success: true, result });
}
