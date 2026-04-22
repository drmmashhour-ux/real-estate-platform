import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[transaction.audit-proof]";

/** Deterministic JSON-ish digest for nested payloads (sorted keys). */
export function auditPayloadDigest(payload: unknown): string {
  const normalized = normalizeForAudit(payload);
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

function normalizeForAudit(v: unknown): unknown {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(normalizeForAudit);
  const o = v as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(o).sort()) {
    out[k] = normalizeForAudit(o[k]);
  }
  return out;
}

/** Tamper-evident chain: hash = SHA256(previousHash | eventType | documentId | payloadDigest | isoTime). Rows are append-only. */
export async function appendAuditProof(input: {
  transactionId: string;
  documentId?: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
}) {
  const last = await prisma.lecipmSdAuditProof.findFirst({
    where: { transactionId: input.transactionId },
    orderBy: { timestamp: "desc" },
    select: { hash: true },
  });
  const previousHash = last?.hash ?? null;
  const ts = new Date();
  const payloadDigest = auditPayloadDigest(input.payload ?? {});
  const preimage = `${previousHash ?? ""}|${input.eventType}|${input.documentId ?? ""}|${payloadDigest}|${ts.toISOString()}`;
  const hash = createHash("sha256").update(preimage).digest("hex");

  const row = await prisma.lecipmSdAuditProof.create({
    data: {
      transactionId: input.transactionId,
      documentId: input.documentId ?? undefined,
      hash,
      previousHash: previousHash ?? undefined,
      eventType: input.eventType.slice(0, 64),
      payloadJson: (input.payload ?? {}) as Prisma.InputJsonValue,
      timestamp: ts,
    },
  });

  logInfo(TAG, { transactionId: input.transactionId, eventType: input.eventType });
  return row;
}
