/**
 * Mandatory gateway: `enforceAuthorization` → `enforceComplianceAction` (guardrails + persisted decision).
 *
 * Use `decisionOwnerType` / `decisionOwnerId` when the guardrail decision should be scoped to a book/agency
 * owner, while authorization is checked against the acting user (e.g. CRM listing agency, financial book).
 */
import type { GuardrailFacts } from "@/lib/compliance/guardrails";
import { enforceAuthorization } from "@/lib/compliance/enforce-authorization";
import { enforceComplianceAction } from "@/lib/compliance/enforce-compliance-action";

export type EnforceActionGatewayInput = {
  ownerType: string;
  ownerId: string;
  actorId: string;
  actionKey: string;
  entityType: string;
  entityId: string;
  moduleKey: string;
  facts?: GuardrailFacts;
  /** Defaults to `ownerType` / `ownerId` — use for guardrail DB scope when it differs from auth scope. */
  decisionOwnerType?: string;
  decisionOwnerId?: string;
  scopeType?: string;
  scopeId?: string | null;
  submitDelegatedApproval?: boolean;
};

export type LegacyEnforceActionInput = {
  actionKey: string;
  meta?: Record<string, unknown>;
};

export type EnforceActionResult = {
  auth: Awaited<ReturnType<typeof enforceAuthorization>>;
  compliance: Awaited<ReturnType<typeof enforceComplianceAction>>;
};

function isGatewayInput(input: unknown): input is EnforceActionGatewayInput {
  return (
    typeof input === "object" &&
    input !== null &&
    "ownerType" in input &&
    typeof (input as EnforceActionGatewayInput).ownerType === "string" &&
    (input as EnforceActionGatewayInput).ownerType.trim().length > 0
  );
}

export async function enforceAction(input: EnforceActionGatewayInput): Promise<EnforceActionResult>;
export async function enforceAction(input: LegacyEnforceActionInput): Promise<EnforceActionResult>;
export async function enforceAction(
  input: EnforceActionGatewayInput | LegacyEnforceActionInput,
): Promise<EnforceActionResult> {
  if (!isGatewayInput(input)) {
    const legacy = input as LegacyEnforceActionInput;
    if (legacy.actionKey === "release_transaction") {
      const userId = String(legacy.meta?.userId ?? "").trim();
      if (!userId) {
        throw new Error("COMPLIANCE_ENFORCEMENT_REQUIRED");
      }
      const formType = legacy.meta?.formType;
      return enforceAction({
        ownerType: "solo_broker",
        ownerId: userId,
        actorId: userId,
        actionKey: "approve_contract",
        entityType: "transaction_release",
        entityId: typeof formType === "string" ? formType : "release",
        moduleKey: "contracts",
        facts: {
          releaseTransaction: true,
          formType: formType ?? null,
        },
      });
    }
    throw new Error("COMPLIANCE_ENFORCEMENT_REQUIRED");
  }

  const full = input;
  if (!full.actorId?.trim() || !full.ownerId?.trim()) {
    throw new Error("COMPLIANCE_ENFORCEMENT_REQUIRED");
  }

  const auth = await enforceAuthorization({
    ownerType: full.ownerType,
    ownerId: full.ownerId,
    actorId: full.actorId,
    actionKey: full.actionKey,
    entityType: full.entityType,
    entityId: full.entityId,
    scopeType: full.scopeType,
    scopeId: full.scopeId,
    submitDelegatedApproval: full.submitDelegatedApproval,
  });

  const scopeOwnerType = full.decisionOwnerType ?? full.ownerType;
  const scopeOwnerId = full.decisionOwnerId ?? full.ownerId;

  const accountableId = auth.accountability.accountableActorId;
  const manualReviewOwner =
    accountableId !== full.actorId
      ? { manualReviewOwnerType: "solo_broker", manualReviewOwnerId: accountableId }
      : {};

  const compliance = await enforceComplianceAction({
    ownerType: scopeOwnerType,
    ownerId: scopeOwnerId,
    moduleKey: full.moduleKey,
    actionKey: full.actionKey,
    entityType: full.entityType,
    entityId: full.entityId,
    actorType: auth.actor.actorType,
    actorId: auth.actor.userId,
    facts: full.facts ?? {},
    ...manualReviewOwner,
  });

  if (!compliance.allowed) {
    throw new Error(compliance.reasonCode || "ACTION_BLOCKED");
  }

  return { auth, compliance };
}

export { enforceComplianceAction } from "@/lib/compliance/enforce-compliance-action";
export type { EnforceComplianceActionInput, EnforceComplianceActionResult } from "@/lib/compliance/enforce-compliance-action";
