import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { finalizeBrokerApprovalWithSignature } from "@/modules/approval/broker-approval-workflow.service";
import { assessBrokerQuickSignEligibility } from "./quick-sign-eligibility.service";

export class BrokerQuickSignError extends Error {
  constructor(
    message: string,
    public readonly code: "HIGH_RISK" | "PIN_REQUIRED" | "PIN_INVALID" | "FORBIDDEN" | "OACIQ_ACK_REQUIRED",
  ) {
    super(message);
    this.name = "BrokerQuickSignError";
  }
}

export type BrokerQuickSignInput = {
  dealId: string;
  brokerUserId: string;
  intent: string;
  stepUpPin?: string;
  /** Client hint for audit only — e.g. WebAuthn not available */
  clientCapability?: string;
  userAgent?: string | null;
  twoFactorEmailEnabled?: boolean;
};

function envBool(key: string): boolean {
  return process.env[key] === "1" || process.env[key]?.toLowerCase() === "true";
}

function mustVerifyPin(input: BrokerQuickSignInput): boolean {
  if (envBool("BROKER_QUICK_SIGN_REQUIRE_PIN")) return true;
  if (envBool("BROKER_QUICK_SIGN_STRICT_2FA") && input.twoFactorEmailEnabled) return true;
  return false;
}

function verifyStepUpPin(input: BrokerQuickSignInput): void {
  if (!mustVerifyPin(input)) return;
  const expected = process.env.BROKER_QUICK_SIGN_PIN ?? "";
  if (!expected.trim()) {
    throw new BrokerQuickSignError("Quick sign PIN not configured server-side.", "PIN_REQUIRED");
  }
  const suppliedRaw = (input.stepUpPin ?? "").trim();
  if (suppliedRaw.length === 0) {
    throw new BrokerQuickSignError("Step-up PIN required for this account or environment.", "PIN_REQUIRED");
  }
  const a = createHash("sha256").update(suppliedRaw, "utf8").digest();
  const b = createHash("sha256").update(expected.trim(), "utf8").digest();
  if (!timingSafeEqual(a, b)) {
    throw new BrokerQuickSignError("Invalid step-up PIN.", "PIN_INVALID");
  }
}

/**
 * Records broker execution approval with a quick-sign audit envelope.
 * Does not send external signatures — only platform attestation + pipeline advance.
 */
export async function executeBrokerQuickSign(input: BrokerQuickSignInput): Promise<{
  approvalId: string;
  approvedAt: Date;
  tier: "low";
}> {
  const eligibility = await assessBrokerQuickSignEligibility(input.dealId);
  if (eligibility.tier === "high") {
    throw new BrokerQuickSignError(
      eligibility.reasons.join(" ") || "Quick sign unavailable for this deal.",
      "HIGH_RISK",
    );
  }

  verifyStepUpPin(input);

  const uaHash =
    input.userAgent && input.userAgent.length > 0 ?
      createHash("sha256").update(input.userAgent).digest("hex").slice(0, 16)
    : null;

  const broker = await prisma.user.findUnique({
    where: { id: input.brokerUserId },
    select: { id: true, email: true, name: true, role: true },
  });

  const snapshot = {
    channel: "broker_quick_sign_v1",
    intent: input.intent.slice(0, 500),
    eligibilityTier: "low" as const,
    brokerIdentity: {
      userId: broker?.id,
      email: broker?.email,
      name: broker?.name,
      role: broker?.role,
    },
    clientCapability: input.clientCapability ?? null,
    userAgentSha256Prefix: uaHash,
    acknowledgedAt: new Date().toISOString(),
    legalNotice:
      "Broker confirms review intent recorded in-platform. Official OACIQ / brokerage execution remains the broker's responsibility.",
    oaciqBrokerAcknowledged: true,
  };

  const approval = await finalizeBrokerApprovalWithSignature({
    dealId: input.dealId,
    approvedById: input.brokerUserId,
    notes: `Quick sign: ${input.intent.slice(0, 240)}`,
    snapshot,
    oaciqBrokerAcknowledged: true,
    channel: "broker_quick_sign_v1",
  });

  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: input.brokerUserId,
      actionKey: "broker_quick_sign",
      payload: {
        approvalId: approval.legacyApprovalId,
        brokerApprovalId: approval.brokerApprovalId,
        signatureSessionId: approval.signatureSessionId,
        intent: input.intent.slice(0, 200),
        snapshotKeys: Object.keys(snapshot),
      },
    },
  });

  return { approvalId: approval.legacyApprovalId, approvedAt: approval.approvedAt, tier: "low" };
}
