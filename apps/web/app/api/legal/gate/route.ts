import { NextResponse } from "next/server";
import { legalHubFlags } from "@/config/feature-flags";
import { ALL_LEGAL_GATE_ACTIONS } from "@/modules/legal/legal-enforcement-rules";
import { evaluateLegalComplianceForUser } from "@/modules/legal/legal-gate-session.service";
import type { LegalGateAction } from "@/modules/legal/legal-readiness.types";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function isLegalGateAction(s: string): s is LegalGateAction {
  return (ALL_LEGAL_GATE_ACTIONS as readonly string[]).includes(s);
}

/** POST JSON — evaluates deterministic gate + readiness snapshot for the signed-in user. */
export async function POST(req: Request) {
  if (!legalHubFlags.legalHubV1) {
    return NextResponse.json({ error: "Legal Hub is disabled" }, { status: 403 });
  }

  const userId = await getGuestId().catch(() => null);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const o = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const actionRaw = typeof o.action === "string" ? o.action.trim() : "";
  const actorRaw = typeof o.actor === "string" ? o.actor.trim() : "";
  const locale = typeof o.locale === "string" && o.locale.trim() ? o.locale.trim() : "en";
  const country = typeof o.country === "string" && o.country.trim() ? o.country.trim().toLowerCase() : "ca";

  if (!actionRaw || !isLegalGateAction(actionRaw)) {
    return NextResponse.json({ error: "Invalid or missing action" }, { status: 400 });
  }

  const { gate, readiness } = await evaluateLegalComplianceForUser({
    action: actionRaw,
    userId,
    actorHint: actorRaw.length ? actorRaw : null,
    locale,
    country,
    jurisdictionHint: country === "ca" ? "QC" : null,
  });

  return NextResponse.json({
    allowed: gate.allowed,
    mode: gate.mode,
    reasons: gate.reasons,
    blockingRequirements: gate.blockingRequirements,
    readiness,
  });
}
