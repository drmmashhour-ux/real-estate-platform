import { logInfo } from "@/lib/logger";
import { legalHubFlags } from "@/config/feature-flags";
import { logLegalAction } from "./legal-audit.service";
import { legalEnforcementDisabled } from "./legal-enforcement";
import { evaluateLegalComplianceForUser } from "./legal-gate-session.service";
import type { LegalGateAction } from "./legal-readiness.types";
import type { LegalHubActorType } from "./legal.types";

/**
 * HTTP helper for route handlers — uses autonomous marketplace **legal policy** evaluation (not ad-hoc gate calls).
 * SOFT violations log structured info and still return `null` (caller proceeds).
 */
export async function maybeBlockRequestWithLegalGate(params: {
  action: LegalGateAction;
  userId: string;
  actorType: LegalHubActorType;
  locale?: string;
  country?: string;
}): Promise<Response | null> {
  if (!legalHubFlags.legalEnforcementV1 || legalEnforcementDisabled()) {
    return null;
  }

  const locale = params.locale ?? "en";
  const country = params.country ?? "ca";

  const { gate } = await evaluateLegalComplianceForUser({
    action: params.action,
    userId: params.userId,
    actorHint: params.actorType,
    locale,
    country,
    jurisdictionHint: country.toLowerCase() === "ca" ? "QC" : null,
  });

  if (!gate.allowed) {
    void logLegalAction({
      entityType: "legal_gate",
      entityId: params.action,
      action: "gate_hard_block",
      actorId: params.userId,
      actorType: params.actorType,
      metadata: {
        blockingRequirements: gate.blockingRequirements,
        reasons: gate.reasons.slice(0, 24),
        enforcementPath: "autonomous_marketplace_policy",
      },
    });
    return Response.json(
      {
        blocked: true,
        domain: "legal" as const,
        error:
          gate.reasons[0] ??
          "Legal Hub checklist items must be satisfied before this action (platform workflow only — not legal advice).",
        code: "LEGAL_POLICY_BLOCKED",
        reasons: gate.reasons,
        blockingRequirements: gate.blockingRequirements,
        mode: gate.mode,
      },
      { status: 403 },
    );
  }

  if (gate.mode === "soft" && gate.reasons.length > 0) {
    logInfo("[legal_policy] soft warnings — action allowed", {
      action: params.action,
      userId: params.userId,
      reasons: gate.reasons,
    });
  }

  return null;
}
