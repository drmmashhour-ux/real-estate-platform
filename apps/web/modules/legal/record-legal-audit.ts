import { prisma } from "@/lib/db";
import type { LegalFormKey } from "@/modules/legal/legal-engine";

export async function recordLegalFormSigned(params: {
  userId: string;
  formKey: LegalFormKey;
  contextType: string;
  contextId: string;
  version: string;
}): Promise<void> {
  try {
    await prisma.legalEventLog.create({
      data: {
        eventType: "FORM_SIGNED",
        userId: params.userId,
        entityType: "LEGAL_FORM",
        entityId: params.formKey,
        payload: {
          formKey: params.formKey,
          contextType: params.contextType,
          contextId: params.contextId,
          version: params.version,
        } as object,
      },
    });
  } catch {
    /* optional audit */
  }
}
