import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { LEGAL_FORM_VERSION } from "@/modules/legal/form-versions";
import type { LegalFormKey } from "@/modules/legal/legal-engine";
import { recordLegalFormSigned } from "@/modules/legal/record-legal-audit";

export async function hasLegalFormSignature(
  userId: string,
  formKey: LegalFormKey,
  contextType: string,
  contextId = ""
): Promise<boolean> {
  const row = await prisma.legalFormSignature.findUnique({
    where: {
      userId_formKey_contextType_contextId: { userId, formKey, contextType, contextId },
    },
    select: { id: true },
  });
  return !!row;
}

export async function upsertLegalFormSignature(params: {
  userId: string;
  formKey: LegalFormKey;
  contextType: string;
  contextId?: string;
  version?: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  const contextId = params.contextId ?? "";
  const version = params.version ?? LEGAL_FORM_VERSION;
  await prisma.legalFormSignature.upsert({
    where: {
      userId_formKey_contextType_contextId: {
        userId: params.userId,
        formKey: params.formKey,
        contextType: params.contextType,
        contextId,
      },
    },
    create: {
      userId: params.userId,
      formKey: params.formKey,
      contextType: params.contextType,
      contextId,
      version,
      metadata: params.metadata ?? undefined,
    },
    update: {
      version,
      signedAt: new Date(),
      metadata: params.metadata ?? undefined,
    },
  });
  await recordLegalFormSigned({
    userId: params.userId,
    formKey: params.formKey,
    contextType: params.contextType,
    contextId,
    version,
  });
}

/** Load all signature composite keys for a user (for `ComplianceSnapshot.signedFormKeys`). */
export async function loadUserSignatureKeySet(userId: string): Promise<Set<string>> {
  const rows = await prisma.legalFormSignature.findMany({
    where: { userId },
    select: { formKey: true, contextType: true, contextId: true },
  });
  const set = new Set<string>();
  for (const r of rows) {
    set.add(`${r.formKey}|${r.contextType}|${r.contextId}`);
  }
  return set;
}
