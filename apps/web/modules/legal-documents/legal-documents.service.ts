import type {
  LecipmLegalDocumentDispatchChannel,
  LecipmLegalDocumentTemplateKind,
  PlatformRole,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { createSignatureSession } from "@/modules/signature/signature-session.service";
import type { SignatureProviderId } from "@/modules/signature/signature.types";
import { assertBrokerDigitalSignatureMatchesDocument } from "@/modules/digital-signature/broker-approval-gate";
import { domainForTemplateKind, investmentComplianceStrict, legalDocumentsEngineEnabled } from "./legal-documents.domain";
import { assertCapitalAccess, assertDealAccess, assertLegalArtifactReadAccess } from "./legal-documents-access";
import { buildSnapshotForKind } from "./legal-documents.snapshots";
import { renderTemplateHtml } from "./render-template";
import { ensureDefaultTemplates, getLatestTemplateVersion } from "./template-registry.service";
import {
  findRealEstateTransactionIdForDeal,
  formatOaciqDisclosureHtmlAppendix,
  getOaciqDisclosureBundleForTransaction,
} from "@/lib/compliance/oaciq/client-disclosure";

function assertEngineOn() {
  if (!legalDocumentsEngineEnabled()) {
    throw new Error("Legal documents engine is disabled (LECIPM_LEGAL_DOCUMENTS_ENGINE).");
  }
}

export { assertCapitalAccess, assertDealAccess } from "./legal-documents-access";

export async function generateLegalDocumentArtifact(input: {
  kind: LecipmLegalDocumentTemplateKind;
  dealId?: string | null;
  capitalDealId?: string | null;
  userId: string;
  role: PlatformRole;
}): Promise<{ id: string }> {
  assertEngineOn();
  await ensureDefaultTemplates();

  const domain = domainForTemplateKind(input.kind);
  if (input.dealId) await assertDealAccess(input.dealId, input.userId, input.role);
  if (input.capitalDealId) await assertCapitalAccess(input.capitalDealId, input.userId, input.role);

  const tv = await getLatestTemplateVersion(input.kind);
  if (!tv) throw new Error("Template not available.");

  const snapshot = await buildSnapshotForKind(input.kind, {
    dealId: input.dealId ?? undefined,
    capitalDealId: input.capitalDealId ?? undefined,
  });
  let renderedHtml = renderTemplateHtml(tv.version.bodyHtml, snapshot);

  if (input.dealId) {
    const txId = await findRealEstateTransactionIdForDeal(input.dealId);
    if (txId) {
      const bundle = await getOaciqDisclosureBundleForTransaction(txId);
      renderedHtml += formatOaciqDisclosureHtmlAppendix(bundle);
    }
  }

  const artifact = await prisma.lecipmLegalDocumentArtifact.create({
    data: {
      templateVersionId: tv.version.id,
      kind: input.kind,
      domain,
      dealId: input.dealId ?? null,
      capitalDealId: input.capitalDealId ?? null,
      sourceDataSnapshot: asInputJsonValue(snapshot),
      renderedHtml,
      status: "AWAITING_APPROVAL",
      createdByUserId: input.userId,
    },
    select: { id: true },
  });

  if (input.dealId) {
    await prisma.dealExecutionAuditLog
      .create({
        data: {
          dealId: input.dealId,
          actorUserId: input.userId,
          actionKey: "legal_document.generated",
          payload: asInputJsonValue({ artifactId: artifact.id, kind: input.kind }),
        },
      })
      .catch(() => undefined);
  }

  return { id: artifact.id };
}

export async function getLegalDocumentArtifact(input: {
  artifactId: string;
  userId: string;
  role: PlatformRole;
}) {
  const row = await prisma.lecipmLegalDocumentArtifact.findUnique({
    where: { id: input.artifactId },
    include: {
      templateVersion: { include: { template: true } },
      dispatches: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!row) return null;
  if (input.role === "ADMIN") return row;
  await assertLegalArtifactReadAccess({
    dealId: row.dealId,
    capitalDealId: row.capitalDealId,
    userId: input.userId,
    role: input.role,
  });
  return row;
}

export async function approveLegalDocumentArtifact(input: {
  artifactId: string;
  userId: string;
  role: PlatformRole;
  brokerConfirmed: boolean;
}) {
  assertEngineOn();
  if (!input.brokerConfirmed) throw new Error("brokerConfirmed is required to approve.");

  const row = await prisma.lecipmLegalDocumentArtifact.findUnique({
    where: { id: input.artifactId },
  });
  if (!row) throw new Error("Artifact not found.");
  if (row.status !== "AWAITING_APPROVAL" && row.status !== "DRAFT") {
    throw new Error("Artifact is not awaiting approval.");
  }

  if (row.dealId) await assertDealAccess(row.dealId, input.userId, input.role);
  if (row.capitalDealId) await assertCapitalAccess(row.capitalDealId, input.userId, input.role);

  await assertBrokerDigitalSignatureMatchesDocument({
    artifactId: input.artifactId,
    approverUserId: input.userId,
  });

  await prisma.lecipmLegalDocumentArtifact.update({
    where: { id: input.artifactId },
    data: {
      status: "APPROVED",
      approvedByBrokerId: input.userId,
      approvedAt: new Date(),
    },
  });

  if (row.dealId) {
    await prisma.dealExecutionAuditLog
      .create({
        data: {
          dealId: row.dealId,
          actorUserId: input.userId,
          actionKey: "legal_document.approved",
          payload: asInputJsonValue({ artifactId: row.id, kind: row.kind }),
        },
      })
      .catch(() => undefined);
  }

  return { ok: true as const };
}

/** Second gate for investment-domain outbound when `LECIPM_INVESTMENT_LEGAL_DOC_COMPLIANCE_STRICT` is on. */
export async function recordInvestmentLegalComplianceApproval(input: {
  artifactId: string;
  userId: string;
  role: PlatformRole;
  confirmed: boolean;
}) {
  assertEngineOn();
  if (input.role !== "ADMIN") throw new Error("Only administrators may record investment compliance approval.");
  if (!input.confirmed) throw new Error("confirmed is required.");

  const row = await prisma.lecipmLegalDocumentArtifact.findUnique({ where: { id: input.artifactId } });
  if (!row) throw new Error("Artifact not found.");
  if (row.domain !== "INVESTMENT") throw new Error("Compliance gate applies to investment-domain artifacts only.");
  if (row.status !== "APPROVED") throw new Error("Broker approval is required first.");

  await prisma.lecipmLegalDocumentArtifact.update({
    where: { id: input.artifactId },
    data: {
      investmentComplianceApprovedById: input.userId,
      investmentComplianceApprovedAt: new Date(),
    },
  });
  return { ok: true as const };
}

export async function dispatchLegalDocumentArtifact(input: {
  artifactId: string;
  userId: string;
  role: PlatformRole;
  channel: LecipmLegalDocumentDispatchChannel;
  /** Required for ESIGN_ENVELOPE when deal-linked. */
  esign?: { provider: SignatureProviderId; participants: { name: string; role: string; email?: string | null }[] };
}) {
  assertEngineOn();
  const row = await prisma.lecipmLegalDocumentArtifact.findUnique({ where: { id: input.artifactId } });
  if (!row) throw new Error("Artifact not found.");
  if (row.status !== "APPROVED") throw new Error("Only approved documents may be dispatched.");
  if (!row.approvedByBrokerId || !row.approvedAt) throw new Error("Broker approval record is incomplete.");

  if (row.domain === "INVESTMENT" && investmentComplianceStrict()) {
    if (!row.investmentComplianceApprovedById || !row.investmentComplianceApprovedAt) {
      throw new Error("Investment compliance approval is required before dispatch in strict mode.");
    }
  }

  if (row.domain === "INTERNAL_HANDOFF" && input.channel !== "SUPPORTING_INTERNAL") {
    throw new Error("Internal handoff packets may only be recorded as SUPPORTING_INTERNAL unless converted to investor-domain documents.");
  }

  if (row.dealId) await assertDealAccess(row.dealId, input.userId, input.role);
  if (row.capitalDealId) await assertCapitalAccess(row.capitalDealId, input.userId, input.role);

  if (input.channel === "ESIGN_ENVELOPE") {
    if (!row.dealId) throw new Error("E-signature envelopes require a brokerage deal link on the artifact.");
    if (!input.esign?.provider || !input.esign.participants?.length) {
      throw new Error("esign.provider and esign.participants are required for ESIGN_ENVELOPE.");
    }
    const { sessionId } = await createSignatureSession({
      dealId: row.dealId,
      provider: input.esign.provider,
      documentIds: [row.id],
      participants: input.esign.participants,
    });
    await prisma.lecipmLegalDocumentArtifact.update({
      where: { id: row.id },
      data: { signatureSessionId: sessionId, status: "DISPATCHED" },
    });
    await prisma.lecipmLegalDocumentDispatch.create({
      data: {
        artifactId: row.id,
        channel: "ESIGN_ENVELOPE",
        status: "SENT",
        sentAt: new Date(),
        targetSummary: asInputJsonValue({ signatureSessionId: sessionId, provider: input.esign.provider }),
      },
    });
    return { ok: true as const, signatureSessionId: sessionId };
  }

  if (input.channel === "EMAIL") {
    await prisma.lecipmLegalDocumentDispatch.create({
      data: {
        artifactId: row.id,
        channel: "EMAIL",
        status: "SENT",
        sentAt: new Date(),
        targetSummary: asInputJsonValue({
          note: "Audit record only — connect outbound email provider to deliver.",
        }),
      },
    });
    await prisma.lecipmLegalDocumentArtifact.update({
      where: { id: row.id },
      data: { status: "DISPATCHED" },
    });
    return { ok: true as const };
  }

  // SUPPORTING_INTERNAL
  await prisma.lecipmLegalDocumentDispatch.create({
    data: {
      artifactId: row.id,
      channel: "SUPPORTING_INTERNAL",
      status: "SENT",
      sentAt: new Date(),
      targetSummary: asInputJsonValue({ internal: true }),
    },
  });
  await prisma.lecipmLegalDocumentArtifact.update({
    where: { id: row.id },
    data: { status: "DISPATCHED" },
  });
  return { ok: true as const };
}

export async function listLegalDocumentArtifacts(input: {
  userId: string;
  role: PlatformRole;
  domain?: "BROKERAGE" | "INVESTMENT" | "INTERNAL_HANDOFF";
  statusGroup?: "awaiting" | "signed_archived" | "all";
}) {
  assertEngineOn();
  const statusFilter =
    input.statusGroup === "awaiting"
      ? { in: ["AWAITING_APPROVAL", "DRAFT"] as const }
      : input.statusGroup === "signed_archived"
        ? { in: ["DISPATCHED", "ARCHIVED"] as const }
        : undefined;

  if (input.role === "ADMIN") {
    return prisma.lecipmLegalDocumentArtifact.findMany({
      where: {
        ...(input.domain ? { domain: input.domain } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { templateVersion: { include: { template: true } } },
    });
  }

  const [dealRows, capRows] = await Promise.all([
    prisma.deal.findMany({
      where: { brokerId: input.userId },
      select: { id: true },
    }),
    prisma.amfCapitalDeal.findMany({
      where: { sponsorUserId: input.userId },
      select: { id: true },
    }),
  ]);
  const dealIds = dealRows.map((d) => d.id);
  const capIds = capRows.map((c) => c.id);

  return prisma.lecipmLegalDocumentArtifact.findMany({
    where: {
      AND: [
        {
          OR: [{ dealId: { in: dealIds } }, { capitalDealId: { in: capIds } }],
        },
        ...(input.domain ? [{ domain: input.domain }] : []),
        ...(statusFilter ? [{ status: statusFilter }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { templateVersion: { include: { template: true } } },
  });
}
