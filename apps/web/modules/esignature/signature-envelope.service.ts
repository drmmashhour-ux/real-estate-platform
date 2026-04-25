import { prisma } from "@/lib/db";
import { generateOtp6, hashAccessToken, hashOtp, newAccessToken, sha256Hex } from "@/modules/esignature/envelope-crypto";

export const SOURCE_KINDS = ["LEGAL_ARTIFACT", "CLOSING_DOCUMENT", "EXTERNAL"] as const;
export type SourceDocumentKind = (typeof SOURCE_KINDS)[number];

const EVENT = {
  CREATED: "CREATED",
  HASH_LOCKED: "HASH_LOCKED",
  BROKER_APPROVED: "BROKER_APPROVED",
  SENT: "SENT",
  VIEWED: "VIEWED",
  CONSENT_ACCEPTED: "CONSENT_ACCEPTED",
  SIGNED: "SIGNED",
  COMPLETED: "COMPLETED",
  VOIDED: "VOIDED",
} as const;

export async function assertBrokerDealAccess(userId: string, role: string, dealId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, brokerId: true },
  });
  if (!deal) throw new Error("Deal not found");
  if (role === "ADMIN") return deal;
  if (role === "BROKER" && deal.brokerId === userId) return deal;
  throw new Error("Forbidden");
}

export async function assertBrokerSigningConfigured(brokerId: string): Promise<void> {
  const strict = process.env.ESIGNATURE_REQUIRE_PLATFORM_DIGITAL_SIGNATURE === "1";
  const [ds, lic] = await Promise.all([
    prisma.digitalSignature.findFirst({ where: { userId: brokerId }, select: { id: true } }),
    prisma.lecipmBrokerLicenceProfile.findUnique({ where: { userId: brokerId }, select: { id: true } }),
  ]);
  if (strict && !ds) {
    throw new Error("Broker must complete platform digital signature enrollment before approving e-signature envelopes.");
  }
  if (!strict && !ds && !lic) {
    throw new Error("Broker licence profile or digital signature enrollment required before approving e-signature envelopes.");
  }
}

async function appendEvent(input: {
  envelopeId: string;
  eventType: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  documentHashSha256?: string | null;
  metadataJson?: Record<string, unknown>;
}) {
  await prisma.signatureEnvelopeEvent.create({
    data: {
      envelopeId: input.envelopeId,
      eventType: input.eventType,
      actorUserId: input.actorUserId ?? null,
      actorEmail: input.actorEmail ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      documentHashSha256: input.documentHashSha256 ?? null,
      metadataJson: input.metadataJson ?? {},
    },
  });
}

async function loadPdfBufferForEnvelope(
  dealId: string,
  sourceDocumentId: string,
  kind: SourceDocumentKind,
): Promise<{ buffer: Buffer; pdfUrl: string | null } | null> {
  if (kind === "LEGAL_ARTIFACT") {
    const a = await prisma.lecipmLegalDocumentArtifact.findFirst({
      where: { id: sourceDocumentId, dealId },
      select: { lockedPdfBytes: true, pdfStorageKey: true },
    });
    if (a?.lockedPdfBytes && a.lockedPdfBytes.length > 0) {
      return { buffer: Buffer.from(a.lockedPdfBytes), pdfUrl: a.pdfStorageKey ?? null };
    }
    return null;
  }
  if (kind === "CLOSING_DOCUMENT") {
    const d = await prisma.dealClosingDocument.findFirst({
      where: { id: sourceDocumentId, dealId },
      select: { fileUrl: true },
    });
    if (d?.fileUrl?.startsWith("data:application/pdf;base64,")) {
      const b64 = d.fileUrl.split(",")[1] ?? "";
      return { buffer: Buffer.from(b64, "base64"), pdfUrl: null };
    }
    return null;
  }
  return null;
}

export async function createSignatureEnvelope(input: {
  dealId: string;
  createdByUserId: string;
  role: string;
  sourceDocumentId: string;
  sourceDocumentKind: SourceDocumentKind;
  title?: string;
  participants: Array<{
    email: string;
    displayName: string;
    signerRole: string;
    routingOrder: number;
    userId?: string | null;
    requiresOtp?: boolean;
  }>;
}) {
  await assertBrokerDealAccess(input.createdByUserId, input.role, input.dealId);
  if (!SOURCE_KINDS.includes(input.sourceDocumentKind)) {
    throw new Error("Invalid sourceDocumentKind");
  }
  if (!input.participants.length) throw new Error("At least one participant required");

  const envelope = await prisma.signatureEnvelope.create({
    data: {
      dealId: input.dealId,
      sourceDocumentId: input.sourceDocumentId,
      sourceDocumentKind: input.sourceDocumentKind,
      title: input.title?.trim() || "Transaction documents",
      status: "DRAFT",
      createdByUserId: input.createdByUserId,
      participants: {
        create: input.participants.map((p) => ({
          email: p.email.trim().toLowerCase(),
          displayName: p.displayName.trim(),
          signerRole: p.signerRole,
          routingOrder: p.routingOrder,
          userId: p.userId ?? null,
          requiresOtp: Boolean(p.requiresOtp),
        })),
      },
    },
    select: { id: true },
  });

  await appendEvent({
    envelopeId: envelope.id,
    eventType: EVENT.CREATED,
    actorUserId: input.createdByUserId,
    metadataJson: { participantCount: input.participants.length },
  });

  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: input.createdByUserId,
      actionKey: "signature_envelope_created",
      payload: { envelopeId: envelope.id },
    },
  });

  return envelope.id;
}

export async function lockCanonicalDocument(input: {
  envelopeId: string;
  actorUserId: string;
  role: string;
  canonicalPdfBase64?: string | null;
  canonicalPdfUrl?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{ hash: string }> {
  const env = await prisma.signatureEnvelope.findUnique({
    where: { id: input.envelopeId },
    include: { participants: true },
  });
  if (!env) throw new Error("Envelope not found");
  await assertBrokerDealAccess(input.actorUserId, input.role, env.dealId);

  if (env.status === "COMPLETED" || env.status === "VOIDED") {
    throw new Error("Envelope is finalized.");
  }
  if (env.sourceVersionLockedAt && env.documentHashSha256) {
    return { hash: env.documentHashSha256 };
  }

  let buffer: Buffer | null = null;
  let pdfUrl = input.canonicalPdfUrl ?? null;

  if (input.canonicalPdfBase64?.trim()) {
    buffer = Buffer.from(input.canonicalPdfBase64.replace(/^data:application\/pdf;base64,/, "").trim(), "base64");
  }
  if (!buffer || buffer.length === 0) {
    const loaded = await loadPdfBufferForEnvelope(env.dealId, env.sourceDocumentId, env.sourceDocumentKind as SourceDocumentKind);
    if (loaded) {
      buffer = loaded.buffer;
      pdfUrl = pdfUrl ?? loaded.pdfUrl;
    }
  }

  if (!buffer || buffer.length === 0) {
    throw new Error(
      "Canonical PDF required: provide canonicalPdfBase64, or use a legal artifact with locked PDF bytes, or a closing document with embedded base64 PDF.",
    );
  }

  const hash = sha256Hex(buffer);
  const now = new Date();

  await prisma.$transaction([
    prisma.signedDocumentVersion.create({
      data: {
        envelopeId: env.id,
        versionKind: "CANONICAL",
        documentHashSha256: hash,
        pdfUrl: pdfUrl,
        immutable: true,
      },
    }),
    prisma.signatureEnvelope.update({
      where: { id: env.id },
      data: {
        documentHashSha256: hash,
        documentHashBeforeFinalizeSha256: hash,
        hashComputedAt: now,
        sourceVersionLockedAt: now,
        canonicalPdfUrl: pdfUrl,
        updatedAt: now,
      },
    }),
  ]);

  await appendEvent({
    envelopeId: env.id,
    eventType: EVENT.HASH_LOCKED,
    actorUserId: input.actorUserId,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    documentHashSha256: hash,
    metadataJson: { bytes: buffer.length },
  });

  return { hash };
}

export async function approveSignatureEnvelope(input: {
  envelopeId: string;
  brokerUserId: string;
  role: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const env = await prisma.signatureEnvelope.findUnique({
    where: { id: input.envelopeId },
    select: { id: true, dealId: true, status: true, documentHashSha256: true },
  });
  if (!env) throw new Error("Envelope not found");
  const deal = await assertBrokerDealAccess(input.brokerUserId, input.role, env.dealId);
  if (input.role !== "ADMIN" && deal.brokerId !== input.brokerUserId) {
    throw new Error("Only the assigned deal broker may approve this envelope.");
  }
  if (env.status === "COMPLETED" || env.status === "VOIDED") throw new Error("Envelope is finalized.");

  await assertBrokerSigningConfigured(input.brokerUserId);
  const now = new Date();

  await prisma.signatureEnvelope.update({
    where: { id: env.id },
    data: {
      status: "APPROVED",
      approvedByBrokerId: input.brokerUserId,
      approvedAt: now,
      brokerSigningConfiguredAt: now,
      updatedAt: now,
    },
  });

  await appendEvent({
    envelopeId: env.id,
    eventType: EVENT.BROKER_APPROVED,
    actorUserId: input.brokerUserId,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    documentHashSha256: env.documentHashSha256,
  });
}

export type SignerToken = { participantId: string; email: string; accessToken: string; otp?: string };

export async function sendSignatureEnvelope(input: {
  envelopeId: string;
  brokerUserId: string;
  role: string;
  canonicalPdfBase64?: string | null;
  canonicalPdfUrl?: string | null;
  autoApprove?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{ signerTokens: SignerToken[] }> {
  let env = await prisma.signatureEnvelope.findUnique({
    where: { id: input.envelopeId },
    include: { participants: { orderBy: { routingOrder: "asc" } } },
  });
  if (!env) throw new Error("Envelope not found");
  const deal = await assertBrokerDealAccess(input.brokerUserId, input.role, env.dealId);
  if (input.role !== "ADMIN" && deal.brokerId !== input.brokerUserId) {
    throw new Error("Only the assigned deal broker may send this envelope.");
  }
  if (env.status === "COMPLETED" || env.status === "VOIDED") throw new Error("Envelope is finalized.");
  if (env.status === "SENT" || env.status === "IN_PROGRESS") throw new Error("Envelope already sent.");

  if (!env.approvedAt || !env.approvedByBrokerId) {
    if (!input.autoApprove) {
      throw new Error("Broker approval required before send (approve envelope first, or pass autoApprove: true).");
    }
    await approveSignatureEnvelope({
      envelopeId: env.id,
      brokerUserId: input.brokerUserId,
      role: input.role,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    env = await prisma.signatureEnvelope.findUnique({
      where: { id: input.envelopeId },
      include: { participants: { orderBy: { routingOrder: "asc" } } },
    });
    if (!env) throw new Error("Envelope not found");
  }

  await lockCanonicalDocument({
    envelopeId: env.id,
    actorUserId: input.brokerUserId,
    role: input.role,
    canonicalPdfBase64: input.canonicalPdfBase64 ?? null,
    canonicalPdfUrl: input.canonicalPdfUrl ?? null,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  const refreshed = await prisma.signatureEnvelope.findUnique({
    where: { id: env.id },
    include: { participants: { orderBy: { routingOrder: "asc" } } },
  });
  if (!refreshed) throw new Error("Envelope not found");

  const signerTokens: SignerToken[] = [];
  const now = new Date();

  for (const p of refreshed.participants) {
    const token = newAccessToken();
    const otp = p.requiresOtp ? generateOtp6() : undefined;
    await prisma.signatureEnvelopeParticipant.update({
      where: { id: p.id },
      data: {
        accessTokenHash: hashAccessToken(token),
        otpCodeHash: otp ? hashOtp(otp) : null,
        status: "PENDING",
      },
    });
    signerTokens.push({
      participantId: p.id,
      email: p.email,
      accessToken: token,
      ...(otp ? { otp } : {}),
    });
  }

  await prisma.signatureEnvelope.update({
    where: { id: env.id },
    data: {
      status: "SENT",
      sentAt: now,
      updatedAt: now,
    },
  });

  await appendEvent({
    envelopeId: env.id,
    eventType: EVENT.SENT,
    actorUserId: input.brokerUserId,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    documentHashSha256: refreshed.documentHashSha256,
    metadataJson: { recipients: signerTokens.map((s) => s.participantId) },
  });

  return { signerTokens };
}

function nextSignerParticipant(
  participants: Array<{ id: string; status: string; routingOrder: number; signedAt: Date | null }>,
) {
  const ordered = [...participants].sort((a, b) => a.routingOrder - b.routingOrder);
  return ordered.find((p) => p.status !== "SIGNED") ?? null;
}

export async function applySignature(input: {
  envelopeId: string;
  participantId: string;
  accessToken: string;
  consentAccepted: boolean;
  signerNameConfirmed: string;
  documentViewed: boolean;
  otp?: string | null;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  if (!input.consentAccepted) throw new Error("Electronic signature consent is required.");
  if (!input.documentViewed) throw new Error("Signer must confirm the document was viewed.");
  const name = input.signerNameConfirmed?.trim();
  if (!name) throw new Error("Signer name confirmation is required.");

  const env = await prisma.signatureEnvelope.findUnique({
    where: { id: input.envelopeId },
    include: { participants: true },
  });
  if (!env) throw new Error("Envelope not found");
  if (env.status !== "SENT" && env.status !== "IN_PROGRESS") {
    throw new Error("Envelope is not open for signing.");
  }

  const participant = env.participants.find((p) => p.id === input.participantId);
  if (!participant) throw new Error("Participant not found");
  if (participant.status === "SIGNED") throw new Error("Already signed.");

  const tokenHash = hashAccessToken(input.accessToken);
  if (!participant.accessTokenHash || participant.accessTokenHash !== tokenHash) {
    throw new Error("Invalid or missing access token.");
  }

  const expectedNext = nextSignerParticipant(env.participants);
  if (!expectedNext || expectedNext.id !== participant.id) {
    throw new Error("Signing order: another signer must complete first.");
  }

  if (participant.requiresOtp) {
    const otp = input.otp?.trim();
    if (!otp) throw new Error("OTP required for this signer.");
    if (!participant.otpCodeHash || participant.otpCodeHash !== hashOtp(otp)) {
      throw new Error("Invalid OTP.");
    }
  }

  if (input.actorUserId && participant.userId && participant.userId !== input.actorUserId) {
    throw new Error("Session user does not match assigned signer.");
  }

  const now = new Date();
  const hashAtSign = env.documentHashSha256;

  await prisma.$transaction([
    prisma.signatureEnvelopeParticipant.update({
      where: { id: participant.id },
      data: {
        consentAcceptedAt: now,
        signerNameConfirmed: name,
        viewedDocumentAt: now,
        emailVerifiedAt: participant.emailVerifiedAt ?? now,
        otpVerifiedAt: participant.requiresOtp ? now : participant.otpVerifiedAt,
        signedAt: now,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        status: "SIGNED",
      },
    }),
    prisma.signatureEnvelope.update({
      where: { id: env.id },
      data: {
        status: "IN_PROGRESS",
        updatedAt: now,
      },
    }),
  ]);

  await appendEvent({
    envelopeId: env.id,
    eventType: EVENT.VIEWED,
    actorUserId: input.actorUserId ?? null,
    actorEmail: participant.email,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    documentHashSha256: hashAtSign,
    metadataJson: { participantId: participant.id },
  });

  await appendEvent({
    envelopeId: env.id,
    eventType: EVENT.CONSENT_ACCEPTED,
    actorUserId: input.actorUserId ?? null,
    actorEmail: participant.email,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    documentHashSha256: hashAtSign,
    metadataJson: { participantId: participant.id },
  });

  await appendEvent({
    envelopeId: env.id,
    eventType: EVENT.SIGNED,
    actorUserId: input.actorUserId ?? null,
    actorEmail: participant.email,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    documentHashSha256: hashAtSign,
    metadataJson: { participantId: participant.id, signerNameConfirmed: name },
  });

  const after = await prisma.signatureEnvelope.findUnique({
    where: { id: env.id },
    include: { participants: true },
  });
  if (!after) return { completed: false };

  const allSigned = after.participants.every((p) => p.status === "SIGNED");
  if (!allSigned) {
    return { completed: false };
  }

  const finalHash = after.documentHashSha256 ?? "";
  await prisma.$transaction([
    prisma.signedDocumentVersion.create({
      data: {
        envelopeId: after.id,
        versionKind: "FINAL",
        documentHashSha256: finalHash,
        pdfUrl: after.canonicalPdfUrl,
        immutable: true,
      },
    }),
    prisma.signatureEnvelope.update({
      where: { id: after.id },
      data: {
        status: "COMPLETED",
        completedAt: now,
        finalPdfUrl: after.canonicalPdfUrl,
        documentHashBeforeFinalizeSha256: after.documentHashBeforeFinalizeSha256 ?? finalHash,
        updatedAt: now,
      },
    }),
  ]);

  await appendEvent({
    envelopeId: after.id,
    eventType: EVENT.COMPLETED,
    documentHashSha256: finalHash,
    metadataJson: { participantCount: after.participants.length },
  });

  return { completed: true };
}

export async function listSignatureEnvelopesForDashboard(userId: string, role: string) {
  if (role === "ADMIN") {
    return prisma.signatureEnvelope.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { deal: { select: { id: true, dealCode: true } } },
    });
  }
  return prisma.signatureEnvelope.findMany({
    where: { deal: { brokerId: userId } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { deal: { select: { id: true, dealCode: true } } },
  });
}

/** Token-gated read for external signers (magic-link style); masks other signers. */
export async function getSignatureEnvelopeForSigner(envelopeId: string, participantId: string, accessToken: string) {
  const tokenHash = hashAccessToken(accessToken);
  const env = await prisma.signatureEnvelope.findUnique({
    where: { id: envelopeId },
    include: {
      participants: { orderBy: { routingOrder: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      versions: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!env) return null;
  const self = env.participants.find((p) => p.id === participantId);
  if (!self || !self.accessTokenHash || self.accessTokenHash !== tokenHash) {
    throw new Error("Invalid signing link.");
  }
  const peers = env.participants.map((p) =>
    p.id === self.id ?
      stripParticipantSecrets(p)
    : {
        id: p.id,
        routingOrder: p.routingOrder,
        signerRole: p.signerRole,
        status: p.status,
        signedAt: p.signedAt,
        displayName: `Signer (order ${p.routingOrder})`,
        email: "",
      },
  );
  return {
    ...env,
    participants: peers,
    signingSelf: stripParticipantSecrets(self),
  };
}

export async function getSignatureEnvelopeDetail(envelopeId: string, viewerUserId: string, role: string) {
  const env = await prisma.signatureEnvelope.findUnique({
    where: { id: envelopeId },
    include: {
      participants: { orderBy: { routingOrder: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      versions: { orderBy: { createdAt: "asc" } },
      deal: { select: { id: true, brokerId: true, dealCode: true } },
    },
  });
  if (!env) return null;

  if (role !== "ADMIN") {
    const isBroker = env.deal.brokerId === viewerUserId;
    const isLinkedParticipant = env.participants.some((p) => p.userId === viewerUserId);
    if (!isBroker && !isLinkedParticipant) throw new Error("Forbidden");
  }

  return env;
}

export function stripParticipantSecrets<T extends { accessTokenHash?: string | null; otpCodeHash?: string | null }>(
  p: T,
): Omit<T, "accessTokenHash" | "otpCodeHash"> {
  const { accessTokenHash: _a, otpCodeHash: _o, ...rest } = p;
  return rest;
}
