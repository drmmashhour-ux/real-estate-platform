import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { legalAuditLog } from "../legal-logging";

export async function persistBrokerVerificationLog(params: {
  brokerUserId: string;
  fsboListingId?: string | null;
  bnhubHostListingId?: string | null;
  actionKey: string;
  sourceDisclosed?: boolean;
  verificationAttempted?: boolean;
  warningIssued?: boolean;
  sellerMarkedUncooperative?: boolean;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<string | null> {
  try {
    const row = await prisma.brokerVerificationLog.create({
      data: {
        brokerUserId: params.brokerUserId,
        fsboListingId: params.fsboListingId ?? null,
        bnhubHostListingId: params.bnhubHostListingId ?? null,
        actionKey: params.actionKey,
        sourceDisclosed: params.sourceDisclosed ?? false,
        verificationAttempted: params.verificationAttempted ?? false,
        warningIssued: params.warningIssued ?? false,
        sellerMarkedUncooperative: params.sellerMarkedUncooperative ?? false,
        notes: params.notes ?? null,
        metadata:
          params.metadata === undefined || params.metadata === null
            ? undefined
            : (JSON.parse(JSON.stringify(params.metadata)) as Prisma.InputJsonValue),
      },
    });
    return row.id;
  } catch (e) {
    legalAuditLog("broker verification log insert failed", { error: String(e) });
    return null;
  }
}
