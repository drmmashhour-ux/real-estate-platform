import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { requireDealExecutionV1 } from "@/lib/deals/pipeline-feature-guard";
import {
  BrokerQuickSignError,
  executeBrokerQuickSign,
} from "@/modules/broker-quick-sign/broker-quick-sign.service";
import { assessBrokerQuickSignEligibility } from "@/modules/broker-quick-sign/quick-sign-eligibility.service";

export const dynamic = "force-dynamic";

function envBool(key: string): boolean {
  return process.env[key] === "1" || process.env[key]?.toLowerCase() === "true";
}

function pinRequiredForUser(twoFactorEmailEnabled: boolean): boolean {
  return envBool("BROKER_QUICK_SIGN_REQUIRE_PIN") || (envBool("BROKER_QUICK_SIGN_STRICT_2FA") && twoFactorEmailEnabled);
}

/**
 * GET — preflight: risk tier, whether step-up PIN is required, saved session identity summary.
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const gated = requireDealExecutionV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, email: true, name: true, role: true, twoFactorEmailEnabled: true },
  });
  if (!user || !canMutateExecution(auth.userId, user.role, auth.deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const eligibility = await assessBrokerQuickSignEligibility(dealId);

  return NextResponse.json({
    eligibility,
    sessionBroker: {
      userId: user.id,
      displayName: user.name?.trim() || user.email,
      email: user.email,
      role: user.role,
      preAuthenticated: true,
    },
    stepUp: {
      pinRequired: pinRequiredForUser(user.twoFactorEmailEnabled),
      note:
        "Optional PIN / device biometrics are enforced when BROKER_QUICK_SIGN_REQUIRE_PIN or STRICT_2FA is enabled. Face ID requires a WebAuthn-capable flow (future).",
    },
    fullApprovalPath: `/api/deals/${dealId}/execute/approve`,
    disclaimer:
      "Quick sign records broker execution approval in-platform only. It does not file OACIQ forms or deliver third-party signatures.",
  });
}

/**
 * POST — confirm modal + optional PIN; records approval + audit when risk tier is low.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const gated = requireDealExecutionV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true, twoFactorEmailEnabled: true },
  });
  if (!user || !canMutateExecution(auth.userId, user.role, auth.deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { intent?: string; stepUpPin?: string; clientCapability?: string; oaciqBrokerAcknowledged?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const oaciqBrokerAcknowledged = body.oaciqBrokerAcknowledged === true;
  const intent = typeof body.intent === "string" ? body.intent.trim() : "";
  if (intent.length < 8) {
    return NextResponse.json(
      { error: "Intent text required (min 8 chars) — describe what you are approving." },
      { status: 400 },
    );
  }

  try {
    const result = await executeBrokerQuickSign({
      dealId,
      brokerUserId: auth.userId,
      intent,
      oaciqBrokerAcknowledged,
      stepUpPin: body.stepUpPin,
      clientCapability: typeof body.clientCapability === "string" ? body.clientCapability : undefined,
      userAgent: request.headers.get("user-agent"),
      twoFactorEmailEnabled: user.twoFactorEmailEnabled,
    });

    return NextResponse.json({
      ok: true,
      approvalId: result.approvalId,
      approvedAt: result.approvedAt.toISOString(),
      disclaimer:
        "Recorded as broker execution approval. Use the full validation flow for high-risk files or when the platform blocks quick sign.",
    });
  } catch (e) {
    if (e instanceof BrokerQuickSignError) {
      if (e.code === "OACIQ_ACK_REQUIRED") {
        return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
      }
      if (e.code === "HIGH_RISK") {
        const eligibility = await assessBrokerQuickSignEligibility(dealId);
        return NextResponse.json(
          {
            error: e.message,
            code: e.code,
            requiresFullFlow: true,
            eligibility,
            fullApprovalPath: `/api/deals/${dealId}/execute/approve`,
          },
          { status: 409 },
        );
      }
      const status = e.code === "PIN_REQUIRED" ? 400 : 401;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    const msg = e instanceof Error ? e.message : "Quick sign failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
