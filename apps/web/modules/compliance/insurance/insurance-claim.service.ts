import { createHash } from "node:crypto";

import { prisma } from "@/lib/db";

import { logClaim, logCompliance } from "./insurance-log";

const MAX_SUMMARY = 2000;

export type CreateClaimInput = {
  brokerId: string;
  /** Short summary only — full legal narratives must use `privateFileId` once storage is wired. */
  summary: string;
  status?: "DRAFT" | "SUBMITTED";
  privateFileId?: string | null;
};

/**
 * Stores only a bounded summary in DB. Optionally records SHA-256 of raw client payload for audit without persisting secrets.
 */
export async function createInsuranceClaim(input: CreateClaimInput) {
  try {
    const trimmed = (input.summary ?? "").trim().slice(0, MAX_SUMMARY);
    if (!trimmed) {
      logClaim("create_skipped_empty", { brokerId: input.brokerId });
      return { ok: false as const, error: "Summary required" };
    }

    const fingerprint = createHash("sha256").update(trimmed, "utf8").digest("hex");

    const row = await prisma.insuranceClaim.create({
      data: {
        brokerId: input.brokerId,
        description: trimmed,
        privateFileId: input.privateFileId ?? null,
        status: input.status ?? "SUBMITTED",
      },
    });

    logClaim("created", {
      claimId: row.id,
      brokerId: input.brokerId,
      fingerprintPrefix: fingerprint.slice(0, 12),
      hasAttachment: Boolean(input.privateFileId),
    });

    await prisma.brokerComplianceEvent
      .create({
        data: {
          brokerId: input.brokerId,
          type: "RISK",
          message: "Insurance claim filed — internal review queue.",
          severity: "LOW",
        },
      })
      .catch(() => undefined);

    logCompliance("claim_event_logged", { brokerId: input.brokerId });

    return { ok: true as const, claimId: row.id, fingerprint };
  } catch (e) {
    logClaim("create_error", { brokerId: input.brokerId, err: e instanceof Error ? e.message : "unknown" });
    return { ok: false as const, error: "Claim intake failed" };
  }
}
