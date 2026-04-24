import type { LecipmLegalBoundaryEntityType } from "@prisma/client";
import { evaluateBrokerLicenceForBrokerage } from "@/lib/compliance/oaciq/broker-licence-service";
import { prisma } from "@/lib/db";
import { getLecipmDefaultBrokerUserId } from "./broker-attribution";
import { writeLegalBoundaryAudit } from "./legal-boundary-audit.service";
import type { TransactionContext } from "./transaction-context.types";

function mapRow(r: {
  id: string;
  entityType: LecipmLegalBoundaryEntityType;
  entityId: string;
  mode: TransactionContext["mode"];
  brokerId: string | null;
  complianceState: TransactionContext["complianceState"];
  modeSource: TransactionContext["modeSource"];
  createdAt: Date;
  updatedAt: Date;
}): TransactionContext {
  return {
    id: r.id,
    entityType: r.entityType,
    entityId: r.entityId,
    mode: r.mode,
    brokerId: r.brokerId,
    complianceState: r.complianceState,
    modeSource: r.modeSource,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export type BrokerConversionResult =
  | { ok: true; context: TransactionContext }
  | { ok: false; error: string };

/**
 * User opted into broker assistance — pins mode to BROKERED with the configured default broker (env).
 */
export async function convertTransactionToBrokerAssisted(input: {
  entityType: LecipmLegalBoundaryEntityType;
  entityId: string;
  actorUserId: string;
}): Promise<BrokerConversionResult> {
  const brokerId = getLecipmDefaultBrokerUserId();
  if (!brokerId) {
    return { ok: false, error: "DEFAULT_BROKER_NOT_CONFIGURED" };
  }

  const lic = await evaluateBrokerLicenceForBrokerage({ brokerUserId: brokerId, persistCheck: false });
  if (!lic.allowed) {
    return { ok: false, error: "DEFAULT_BROKER_LICENCE_BLOCKED" };
  }

  const entityId = input.entityId.trim();
  const row = await prisma.lecipmTransactionContext.upsert({
    where: { entityType_entityId: { entityType: input.entityType, entityId } },
    create: {
      entityType: input.entityType,
      entityId,
      mode: "BROKERED",
      brokerId,
      complianceState: lic.riskLevel === "LOW" ? "SAFE" : "RESTRICTED",
      modeSource: "CONVERSION",
    },
    update: {
      mode: "BROKERED",
      brokerId,
      complianceState: lic.riskLevel === "LOW" ? "SAFE" : "RESTRICTED",
      modeSource: "CONVERSION",
    },
  });

  await writeLegalBoundaryAudit({
    actionType: "broker_conversion_accepted",
    entityId: row.entityId,
    entityType: row.entityType,
    mode: "BROKERED",
    allowed: true,
    reason: "user_accepted_licensed_broker_prompt",
    actorUserId: input.actorUserId,
  });

  return { ok: true, context: mapRow(row) };
}

export const BROKER_CONVERSION_PROMPT_EN =
  "Would you like to work with a licensed broker to proceed safely?" as const;
