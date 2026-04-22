import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { assertBrokerLaunchBilling } from "@/modules/billing/lecipm-launch-gates";
import { recordBrokerUsageEvent, usageAmountForType } from "@/modules/billing/lecipm-launch-usage";
import { recordComplianceFinding, resolveComplianceChecksByType } from "@/modules/transactions/transaction-compliance.service";
import type { PlatformRole } from "@prisma/client";
import type { TrustiiCreateRequestResult, TrustiiFetchResultPayload, TrustiiProviderConfig } from "./trustii.types";

const TAG = "[trustii]";

function providerConfig(): TrustiiProviderConfig {
  const apiKey = process.env.TRUSTII_API_KEY?.trim();
  const apiBaseUrl = process.env.TRUSTII_API_BASE_URL?.trim() || "https://api.trustii.example";
  const simulate =
    process.env.TRUSTII_SIMULATE === "true" ||
    process.env.TRUSTII_SIMULATE === "1" ||
    !apiKey;
  return { apiBaseUrl, apiKey, simulate };
}

/** Placeholder HTTP call — replace with Trustii REST contract when available. */
async function trustiiHttpCreate(_args: {
  applicantName: string;
  email: string;
  transactionNumber: string;
}): Promise<{ externalId: string } | null> {
  const cfg = providerConfig();
  if (cfg.simulate || !cfg.apiKey) return null;
  try {
    const res = await fetch(`${cfg.apiBaseUrl}/v1/credit-requests`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        applicantName: _args.applicantName,
        email: _args.email,
        reference: _args.transactionNumber,
      }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { id?: string };
    return j.id ? { externalId: j.id } : null;
  } catch {
    return null;
  }
}

async function trustiiHttpFetch(_externalId: string): Promise<TrustiiFetchResultPayload | null> {
  const cfg = providerConfig();
  if (cfg.simulate || !cfg.apiKey) return null;
  try {
    const res = await fetch(`${cfg.apiBaseUrl}/v1/credit-requests/${encodeURIComponent(_externalId)}`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { status?: string; score?: number; reportUrl?: string };
    const st = j.status?.toUpperCase();
    return {
      status: st === "COMPLETED" ? "COMPLETED" : st === "FAILED" ? "FAILED" : "SENT",
      score: typeof j.score === "number" ? j.score : null,
      reportUrl: typeof j.reportUrl === "string" ? j.reportUrl : null,
    };
  } catch {
    return null;
  }
}

export async function createCreditCheck(input: {
  transactionId: string;
  applicantName: string;
  email: string;
  billing?: { actorRole: PlatformRole };
}) {
  const tx = await prisma.lecipmSdTransaction.findUnique({
    where: { id: input.transactionId },
    select: { id: true, brokerId: true, transactionNumber: true, transactionType: true },
  });
  if (!tx) throw new Error("Transaction not found");

  if (input.billing) {
    await assertBrokerLaunchBilling({
      brokerUserId: tx.brokerId,
      actorRole: input.billing.actorRole,
      action: "CREDIT_CHECK",
    });
  }

  const row = await prisma.lecipmTenantCreditCheck.create({
    data: {
      transactionId: input.transactionId,
      applicantName: input.applicantName.trim().slice(0, 512),
      email: input.email.trim().slice(0, 320),
      status: "PENDING",
      provider: "TRUSTII",
    },
  });

  logInfo(TAG, { action: "createCreditCheck", id: row.id, transactionId: input.transactionId });
  return row;
}

export async function sendRequest(checkId: string): Promise<{ externalRequestId: string | null; simulated: boolean }> {
  const row = await prisma.lecipmTenantCreditCheck.findUnique({
    where: { id: checkId },
    include: {
      transaction: { select: { transactionNumber: true } },
    },
  });
  if (!row) throw new Error("Credit check not found");

  let externalRequestId: string | null = null;
  let simulated = providerConfig().simulate;

  const remote = await trustiiHttpCreate({
    applicantName: row.applicantName,
    email: row.email,
    transactionNumber: row.transaction.transactionNumber,
  });

  if (remote) {
    externalRequestId = remote.externalId;
    simulated = false;
  } else {
    externalRequestId = `sim_${row.id}`;
    simulated = true;
  }

  await prisma.lecipmTenantCreditCheck.update({
    where: { id: checkId },
    data: {
      externalRequestId,
      status: "SENT",
    },
  });

  logInfo(TAG, { action: "sendRequest", checkId, externalRequestId, simulated });
  return { externalRequestId, simulated };
}

export async function fetchResult(checkId: string): Promise<TrustiiFetchResultPayload> {
  const row = await prisma.lecipmTenantCreditCheck.findUnique({
    where: { id: checkId },
    include: { transaction: { select: { brokerId: true } } },
  });
  if (!row?.externalRequestId) throw new Error("Credit check not sent");

  const prevStatus = row.status;
  let payload: TrustiiFetchResultPayload | null = null;

  if (!row.externalRequestId.startsWith("sim_")) {
    payload = await trustiiHttpFetch(row.externalRequestId);
  }

  if (!payload) {
    /** Deterministic sandbox outcome for demos */
    const hash = [...row.email].reduce((a, c) => a + c.charCodeAt(0), 0);
    const score = 620 + (hash % 180);
    payload = {
      status: "COMPLETED",
      score,
      reportUrl: `https://trustii.example/reports/${encodeURIComponent(row.id)}`,
    };
  }

  await prisma.lecipmTenantCreditCheck.update({
    where: { id: checkId },
    data: {
      status: payload.status,
      score: payload.score ?? undefined,
      reportUrl: payload.reportUrl ?? undefined,
    },
  });

  if (payload.status === "COMPLETED") {
    await attachToTransactionCompliance(row.transactionId, payload.score);
    if (prevStatus !== "COMPLETED") {
      await attachToTransactionBilling({
        brokerUserId: row.transaction.brokerId,
        creditCheckId: checkId,
        transactionId: row.transactionId,
      });
    }
  }

  logInfo(TAG, { action: "fetchResult", checkId, status: payload.status });
  return payload;
}

async function attachToTransactionCompliance(transactionId: string, score: number | null): Promise<void> {
  await resolveComplianceChecksByType(transactionId, "TENANT_CREDIT_PENDING");

  const lowThreshold = Number(process.env.LECIPM_CREDIT_SCORE_LOW_THRESHOLD ?? "600") || 600;

  if (score != null && score < lowThreshold) {
    await recordComplianceFinding({
      transactionId,
      checkType: "TENANT_CREDIT_LOW_SCORE",
      severity: "WARNING",
      message: `Tenant credit score (${score}) is below policy threshold (${lowThreshold}). Consider guarantor or rejection — AI-assisted review recommended.`,
    });
  }
}

/** Records revenue usage when a completed credit check is billed (call once per check completion). */
export async function attachToTransactionBilling(args: {
  brokerUserId: string;
  creditCheckId: string;
  transactionId: string;
}) {
  await recordBrokerUsageEvent({
    userId: args.brokerUserId,
    type: "CREDIT_CHECK",
    amount: usageAmountForType("CREDIT_CHECK"),
    metaJson: { creditCheckId: args.creditCheckId, transactionId: args.transactionId },
  });
}

export async function attachToTransaction(checkId: string): Promise<{ transactionId: string }> {
  const row = await prisma.lecipmTenantCreditCheck.findUnique({
    where: { id: checkId },
    select: { transactionId: true },
  });
  if (!row) throw new Error("Credit check not found");
  return { transactionId: row.transactionId };
}
