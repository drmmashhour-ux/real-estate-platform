import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { EnforceableContractType } from "@/lib/legal/enforceable-contract-types";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import {
  assertOaciqClientDisclosureAck,
  formatOaciqDisclosurePlainText,
  getOaciqDisclosureBundleForTransaction,
  oaciqClientDisclosureEnforcementEnabled,
} from "@/lib/compliance/oaciq/client-disclosure";
import { assertBrokerApprovedContractSign } from "@/lib/compliance/oaciq/broker-decision-authority";
import { assertBrokerProfessionalInsuranceActiveOrThrow } from "@/lib/compliance/oaciq/broker-professional-insurance.service";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inferHub(contractType: string): string {
  if (contractType.includes("host") || contractType.includes("short") || contractType.includes("rental")) return "bnhub";
  if (contractType.includes("broker")) return "broker";
  if (contractType.includes("buyer") || contractType.includes("seller")) return "realestate";
  return "platform";
}

export async function appendContractAuditLog(params: {
  contractId: string;
  userId: string | null;
  action: "created" | "signed" | "pdf_download";
  ipAddress: string | null;
  version: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.legalContractAuditLog.create({
    data: {
      contractId: params.contractId,
      userId: params.userId ?? undefined,
      action: params.action,
      ipAddress: params.ipAddress ?? undefined,
      version: params.version ?? undefined,
      metadata: params.metadata ? (params.metadata as object) : undefined,
    },
  });
}

/**
 * Create a signed enforceable contract + primary `ContractSignature` + audit rows (single transaction).
 */
export async function createSignedEnforceableContract(params: {
  userId: string;
  email: string;
  name: string;
  contractType: EnforceableContractType;
  version: string;
  contentText: string;
  title: string;
  fsboListingId?: string | null;
  listingId?: string | null;
  /** When set, OACIQ client disclosure is enforced (if enabled) and appended to the stored agreement. */
  realEstateTransactionId?: string | null;
  ipAddress: string | null;
  signatureData?: string | null;
}): Promise<{ id: string }> {
  if (params.contractType === ENFORCEABLE_CONTRACT_TYPES.BROKER) {
    await assertBrokerProfessionalInsuranceActiveOrThrow(params.userId, "enforceable_contract_sign_broker");
  }

  let contentText = params.contentText;
  if (params.realEstateTransactionId) {
    const rtx = await prisma.realEstateTransaction.findUnique({
      where: { id: params.realEstateTransactionId },
      select: { buyerId: true, sellerId: true, brokerId: true },
    });
    if (rtx?.brokerId) {
      const party = rtx.buyerId === params.userId || rtx.sellerId === params.userId;
      const isBrokerSigner = rtx.brokerId === params.userId;
      if (party && !isBrokerSigner) {
        await assertBrokerApprovedContractSign({
          responsibleBrokerId: rtx.brokerId,
          realEstateTransactionId: params.realEstateTransactionId,
        });
      }
    }

    if (oaciqClientDisclosureEnforcementEnabled()) {
      await assertOaciqClientDisclosureAck({
        transactionId: params.realEstateTransactionId,
        userId: params.userId,
        flow: "CONTRACT_SIGN",
      });
    }
    const bundle = await getOaciqDisclosureBundleForTransaction(params.realEstateTransactionId);
    contentText = `${contentText}\n\n---\n${formatOaciqDisclosurePlainText(bundle)}`;
  }

  const html = `<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif">${escapeHtml(contentText)}</pre>`;
  const meta: Prisma.InputJsonValue = {
    enforceable: true,
    version: params.version,
    signedName: params.name,
    ...(params.realEstateTransactionId
      ? { oaciqRealEstateTransactionId: params.realEstateTransactionId }
      : {}),
  };

  const contract = await prisma.$transaction(async (tx) => {
    const c = await tx.contract.create({
      data: {
        type: params.contractType,
        userId: params.userId,
        title: params.title,
        contentText,
        contentHtml: html,
        version: params.version,
        fsboListingId: params.fsboListingId ?? undefined,
        listingId: params.listingId ?? undefined,
        status: "signed",
        signed: true,
        signedAt: new Date(),
        signerIpAddress: params.ipAddress ?? undefined,
        content: meta,
        hub: inferHub(params.contractType),
      },
    });

    await tx.contractSignature.create({
      data: {
        contractId: c.id,
        userId: params.userId,
        name: params.name,
        email: params.email,
        role: "signer",
        signedAt: new Date(),
        ipAddress: params.ipAddress ?? undefined,
        signatureData: params.signatureData ?? undefined,
      },
    });

    await tx.legalContractAuditLog.create({
      data: {
        contractId: c.id,
        userId: params.userId,
        action: "created",
        ipAddress: params.ipAddress ?? undefined,
        version: params.version,
      },
    });

    await tx.legalContractAuditLog.create({
      data: {
        contractId: c.id,
        userId: params.userId,
        action: "signed",
        ipAddress: params.ipAddress ?? undefined,
        version: params.version,
        metadata: { signerName: params.name } as object,
      },
    });

    return c;
  });

  void import("@/modules/notifications/services/create-notification").then(({ createNotification }) =>
    createNotification({
      userId: params.userId,
      type: "CONTRACT",
      title: "Agreement signed",
      message: `${params.title} was signed and stored.`,
      priority: "NORMAL",
      actionUrl: `/dashboard/contracts`,
      contractId: contract.id,
    })
  );

  return { id: contract.id };
}

export async function hasActiveEnforceableContract(
  userId: string,
  contractType: EnforceableContractType,
  ctx: { fsboListingId?: string | null; listingId?: string | null }
): Promise<boolean> {
  if (contractType === ENFORCEABLE_CONTRACT_TYPES.BROKER) {
    const row = await prisma.contract.findFirst({
      where: {
        userId,
        type: contractType,
        signed: true,
        fsboListingId: null,
        listingId: null,
        bookingId: null,
      },
    });
    return !!row;
  }

  if (ctx.fsboListingId) {
    const row = await prisma.contract.findFirst({
      where: { userId, type: contractType, signed: true, fsboListingId: ctx.fsboListingId },
    });
    return !!row;
  }

  if (ctx.listingId) {
    const row = await prisma.contract.findFirst({
      where: {
        userId,
        type: contractType,
        signed: true,
        OR: [{ listingId: ctx.listingId }, { fsboListingId: ctx.listingId }],
      },
    });
    return !!row;
  }

  return false;
}
