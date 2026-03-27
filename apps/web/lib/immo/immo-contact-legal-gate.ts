import { LeadContactOrigin } from "@prisma/client";
import { buildComplianceSnapshotForBuyerHub } from "@/modules/legal/legal-snapshot";
import {
  BUYER_CONTACT_GLOBAL_FSBO_LISTING_ID,
  validateForms,
  type LegalFormRequirement,
} from "@/modules/legal/legal-engine";
import { assertBrokerAgreementSigned, ensureBrokerAgreementContract } from "@/lib/contracts/broker-agreement-contract";
import { legalEnforcementDisabled } from "@/modules/legal/legal-enforcement";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";

export type ImmoContactLegalResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "BROKER_AGREEMENT_REQUIRED"
        | "BUYER_ACKNOWLEDGMENT_REQUIRED"
        | "SIGN_IN_REQUIRED"
        | "ENFORCEABLE_BROKER_REQUIRED";
      message: string;
      brokerReasons?: string[];
      missing?: LegalFormRequirement[];
    };

/**
 * Enforces broker BROKER_AGREEMENT (Contract) and buyer BUYER_ACKNOWLEDGMENT (legal form) for Immo flows.
 * Guests may pass init (lead tracking) but must sign in + acknowledge before messages (see chat gate).
 */
export async function assertImmoContactLegalForSession(params: {
  brokerId: string | null | undefined;
  buyerUserId: string | null | undefined;
  /** When true, require buyer acknowledgment if logged in. */
  requireBuyerAck: boolean;
}): Promise<ImmoContactLegalResult> {
  if (legalEnforcementDisabled()) return { ok: true };

  if (params.brokerId) {
    await ensureBrokerAgreementContract(params.brokerId);
    const brokerGate = await assertBrokerAgreementSigned(params.brokerId);
    if (!brokerGate.ok) {
      return {
        ok: false,
        code: "BROKER_AGREEMENT_REQUIRED",
        message: brokerGate.reasons[0] ?? "The listing broker must sign the platform broker agreement before Immo contact.",
        brokerReasons: brokerGate.reasons,
      };
    }
    if (enforceableContractsRequired()) {
      const enforce = await hasActiveEnforceableContract(params.brokerId, ENFORCEABLE_CONTRACT_TYPES.BROKER, {});
      if (!enforce) {
        return {
          ok: false,
          code: "ENFORCEABLE_BROKER_REQUIRED",
          message:
            "The broker must sign the platform enforceable collaboration agreement (ContractSign kind=broker) before Immo contact.",
        };
      }
    }
  }

  if (params.requireBuyerAck && params.buyerUserId) {
    const snap = await buildComplianceSnapshotForBuyerHub(params.buyerUserId);
    const v = validateForms(
      { context: "buyer_contact", fsboListingId: BUYER_CONTACT_GLOBAL_FSBO_LISTING_ID },
      snap
    );
    if (!v.ok) {
      return {
        ok: false,
        code: "BUYER_ACKNOWLEDGMENT_REQUIRED",
        message: v.blockingReasons[0] ?? "Complete the buyer acknowledgment before continuing.",
        missing: v.missing,
      };
    }
  }

  return { ok: true };
}

/** Buyer must be logged in to send Immo chat messages when enforcement is on. */
export function assertImmoGuestCanMessage(buyerUserId: string | null | undefined): ImmoContactLegalResult {
  if (legalEnforcementDisabled()) return { ok: true };
  if (!buyerUserId) {
    return {
      ok: false,
      code: "SIGN_IN_REQUIRED",
      message: "Sign in to continue — platform terms apply to Immo contact messages.",
    };
  }
  return { ok: true };
}

export function setCommissionSourceFields(origin: LeadContactOrigin) {
  return {
    contactOrigin: origin,
    commissionSource: origin,
    commissionEligible: origin === LeadContactOrigin.IMMO_CONTACT,
  };
}
