import { NextResponse } from "next/server";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { complianceFlags } from "@/config/feature-flags";
import type { ClauseInstance } from "@/lib/compliance/oaciq/clause-compliance/types";
import {
  validateClauseBatch,
  validateLegacyClauseStrings,
} from "@/lib/compliance/oaciq/clause-compliance/validate-engine";

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

/**
 * POST — clause validation for broker drafting.
 * When `FEATURE_OACIQ_CLAUSE_COMPLIANCE_ENGINE_V1` is on: structured `clauseInstances` or legacy `clauses` strings use the OACIQ engine.
 * Otherwise: legacy heuristic (must / digit).
 */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required", errors: ["Sign in required"] }, { status: 401 });
  }
  const role = await getUserRole();
  if (role !== "BROKER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Broker access required", errors: ["Broker access required"] }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errors: ["Invalid JSON"] }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  if (complianceFlags.oaciqClauseComplianceEngineV1) {
    const instances = parseInstances(o.clauseInstances);
    if (instances && instances.length > 0) {
      const withAi = o.withAiSuggestions === true;
      const result = await validateClauseBatch({ instances, withAiSuggestions: withAi });
      const errors = result.issues.filter((i) => i.severity === "blocking").map((i) => i.message);
      return NextResponse.json({ errors, clauseCompliance: result });
    }

    const clauses = o.clauses;
    if (Array.isArray(clauses)) {
      const strings = clauses.filter((c): c is string => typeof c === "string");
      const result = validateLegacyClauseStrings(strings);
      const errors = result.issues.filter((i) => i.severity === "blocking").map((i) => i.message);
      return NextResponse.json({ errors, clauseCompliance: result });
    }

    return NextResponse.json({ errors: ["clauses or clauseInstances must be an array"] }, { status: 400 });
  }

  const clauses = o.clauses;
  if (!Array.isArray(clauses)) {
    return NextResponse.json({ errors: ["clauses must be an array"] }, { status: 400 });
  }

  const errors: string[] = [];

  clauses.forEach((c, i) => {
    if (typeof c !== "string") {
      errors.push(`Clause ${i + 1} must be text`);
      return;
    }
    const text = c.trim();
    if (!text) {
      errors.push(`Clause ${i + 1} is empty`);
      return;
    }
    if (!text.toLowerCase().includes("must")) {
      errors.push(`Clause ${i + 1} missing clear obligation`);
    }
    if (!/\d/.test(text)) {
      errors.push(`Clause ${i + 1} missing deadline`);
    }
  });

  return NextResponse.json({ errors });
}
