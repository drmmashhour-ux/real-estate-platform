import type { LogAuditInput } from "@/lib/compliance/log-audit-event";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { createAccountabilityRecord, type CreateAccountabilityRecordInput } from "@/lib/compliance/create-accountability-record";
import { upsertRecordRetention, type CreateRecordRetentionInput } from "@/lib/compliance/record-retention.service";
import { assertNoActiveLegalHold } from "@/lib/compliance/retention-legal-hold-guards";

type AccountabilityPayload = Omit<CreateAccountabilityRecordInput, "skipAccountabilityAudit">;

export type RegulatedComplianceActionInput = {
  audit: LogAuditInput;
  accountability: AccountabilityPayload;
  retention?: CreateRecordRetentionInput;
  /** When set, runs `assertNoActiveLegalHold` before side effects. */
  legalHoldScope?: {
    ownerType: string;
    ownerId: string;
    entityType?: string;
    entityId?: string;
  };
};

/**
 * Recommended pattern for legally defensible actions: legal-hold check → audit → accountability → optional retention row.
 * Accountability row skips its secondary audit when the primary `audit` event is already logged.
 */
export async function executeRegulatedComplianceAction(input: RegulatedComplianceActionInput) {
  if (input.legalHoldScope) {
    await assertNoActiveLegalHold(input.legalHoldScope);
  }

  const auditRow = await logAuditEvent(input.audit);

  const accountabilityRow = await createAccountabilityRecord({
    ...input.accountability,
    skipAccountabilityAudit: true,
  });

  let retentionRow = null as Awaited<ReturnType<typeof upsertRecordRetention>> | null;
  if (input.retention) {
    retentionRow = await upsertRecordRetention(input.retention);
  }

  return { auditRow, accountabilityRow, retentionRow };
}
