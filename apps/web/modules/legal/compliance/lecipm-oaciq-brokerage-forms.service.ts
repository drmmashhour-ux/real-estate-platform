/**
 * LECIPM — OACIQ brokerage contracts + seller declaration compliance (2022 mandatory forms).
 * AI may assist with drafting checks only; it must not approve transactions or waive refusals.
 */

import {
  type BrokerageContractStatus,
  type BrokerageContractType,
  ComplianceFormAction,
  ComplianceFormEntityType,
  OaciqMandatoryFormVersion,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";

export type OaciqBrokerageComplianceSlice = {
  contract: null | {
    id: string;
    formVersion: OaciqMandatoryFormVersion;
    status: BrokerageContractStatus;
    includesDistributionAuthorization: boolean;
  };
  declaration: null | {
    id: string;
    sellerId: string;
    formVersion: OaciqMandatoryFormVersion;
    completed: boolean;
    signed: boolean;
    refused: boolean;
  };
  disclosure: null | { disclosedToBuyer: boolean };
  identityVerified: boolean;
};

/** Spec §3 — core gate (disclosure / active mandate layered in readiness). */
export function validateOaciqBrokerageListingCompliance(listing: {
  contract: OaciqBrokerageComplianceSlice["contract"];
  declaration: OaciqBrokerageComplianceSlice["declaration"];
  identityVerified: boolean;
}): { ok: true } | { ok: false; code: string } {
  if (!listing.contract) {
    return { ok: false, code: "NO_CONTRACT" };
  }
  if (listing.contract.formVersion !== OaciqMandatoryFormVersion.REFORM_2022_MANDATORY) {
    return { ok: false, code: "INVALID_FORM_VERSION" };
  }
  if (!listing.declaration?.completed) {
    return { ok: false, code: "DECLARATION_INCOMPLETE" };
  }
  if (listing.declaration.refused) {
    return { ok: false, code: "DECLARATION_REFUSED_BLOCK" };
  }
  if (!listing.identityVerified) {
    return { ok: false, code: "IDENTITY_NOT_VERIFIED" };
  }
  return { ok: true };
}

export type OaciqBrokerageCheckPayload = {
  contract_valid: boolean;
  declaration_signed: boolean;
  declaration_refused: boolean;
  identity_verified: boolean;
  disclosure_complete: boolean;
  form_version_valid: boolean;
  ready_for_transaction: boolean;
  /** True when mandate expired but distribution authorization was recorded (informational). */
  distribution_authorization_survives: boolean;
  compliance_codes: string[];
};

function contractRecordValid(
  contract: OaciqBrokerageComplianceSlice["contract"]
): boolean {
  if (!contract) return false;
  if (contract.formVersion !== OaciqMandatoryFormVersion.REFORM_2022_MANDATORY) return false;
  return contract.status === "active" || contract.status === "expired";
}

function formVersionValid(slice: OaciqBrokerageComplianceSlice): boolean {
  const cOk = slice.contract?.formVersion === OaciqMandatoryFormVersion.REFORM_2022_MANDATORY;
  const dOk = slice.declaration?.formVersion === OaciqMandatoryFormVersion.REFORM_2022_MANDATORY;
  return Boolean(cOk && dOk && slice.contract && slice.declaration);
}

export function buildOaciqBrokerageCheckPayload(slice: OaciqBrokerageComplianceSlice): OaciqBrokerageCheckPayload {
  const core = validateOaciqBrokerageListingCompliance({
    contract: slice.contract,
    declaration: slice.declaration,
    identityVerified: slice.identityVerified,
  });

  const contractValid = contractRecordValid(slice.contract);
  const declarationSigned = Boolean(slice.declaration?.signed && slice.declaration?.completed && !slice.declaration?.refused);
  const declarationRefused = Boolean(slice.declaration?.refused);
  const disclosureComplete = Boolean(slice.disclosure?.disclosedToBuyer);
  const fv = formVersionValid(slice);

  const mandateActive = slice.contract?.status === "active";
  const distributionSurvives =
    slice.contract?.status === "expired" && Boolean(slice.contract?.includesDistributionAuthorization);

  const complianceCodes = core.ok ? [] : [core.code];
  if (!mandateActive && slice.contract && slice.contract.status !== "expired") {
    complianceCodes.push("CONTRACT_NOT_ACTIVE");
  }

  const readyForTransaction =
    core.ok &&
    fv &&
    declarationSigned &&
    !declarationRefused &&
    disclosureComplete &&
    mandateActive;

  return {
    contract_valid: contractValid,
    declaration_signed: declarationSigned,
    declaration_refused: declarationRefused,
    identity_verified: slice.identityVerified,
    disclosure_complete: disclosureComplete,
    form_version_valid: fv,
    ready_for_transaction: readyForTransaction,
    distribution_authorization_survives: distributionSurvives,
    compliance_codes: [...new Set(complianceCodes)],
  };
}

/** Publish gate: mandatory forms + active mandate; disclosure to buyer is offer-phase, not required here. */
export function oaciqBrokerageFormsAllowListingPublish(slice: OaciqBrokerageComplianceSlice): boolean {
  if (slice.declaration?.refused) return false;
  const mandateActive = slice.contract?.status === "active";
  const core = validateOaciqBrokerageListingCompliance({
    contract: slice.contract,
    declaration: slice.declaration,
    identityVerified: slice.identityVerified,
  });
  return core.ok && mandateActive && formVersionValid(slice);
}

export async function loadOaciqBrokerageComplianceSlice(listingId: string): Promise<OaciqBrokerageComplianceSlice> {
  const contract = await prisma.lecipmBrokerageContract.findUnique({
    where: { listingId },
    select: {
      id: true,
      formVersion: true,
      status: true,
      includesDistributionAuthorization: true,
    },
  });

  const declaration = await prisma.lecipmCrmOaciqSellerDeclaration.findFirst({
    where: { listingId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      sellerId: true,
      formVersion: true,
      completed: true,
      signed: true,
      refused: true,
      disclosure: { select: { disclosedToBuyer: true } },
    },
  });

  let identityVerified = false;
  if (declaration) {
    const proof = await prisma.lecipmBrokerageIdentityProof.findUnique({
      where: {
        listingId_sellerUserId: { listingId, sellerUserId: declaration.sellerId },
      },
      select: { id: true },
    });
    identityVerified = Boolean(proof);
  }

  return {
    contract: contract
      ? {
          id: contract.id,
          formVersion: contract.formVersion,
          status: contract.status,
          includesDistributionAuthorization: contract.includesDistributionAuthorization,
        }
      : null,
    declaration: declaration
      ? {
          id: declaration.id,
          sellerId: declaration.sellerId,
          formVersion: declaration.formVersion,
          completed: declaration.completed,
          signed: declaration.signed,
          refused: declaration.refused,
        }
      : null,
    disclosure: declaration?.disclosure ? { disclosedToBuyer: declaration.disclosure.disclosedToBuyer } : null,
    identityVerified,
  };
}

export async function logComplianceFormEvent(
  tx: Prisma.TransactionClient | typeof prisma,
  input: {
    entityType: ComplianceFormEntityType;
    entityId: string;
    action: ComplianceFormAction;
    performedByUserId: string | null;
    aiAssisted?: boolean;
    notes?: string | null;
  }
): Promise<void> {
  await tx.complianceFormLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      performedByUserId: input.performedByUserId,
      aiAssisted: input.aiAssisted ?? false,
      notes: input.notes ?? null,
    },
  });
}

export async function freezeListingForOaciqRefusal(listingId: string, reason: string): Promise<void> {
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      crmMarketplaceLive: false,
      lecipmOaciqComplianceHoldAt: new Date(),
      lecipmOaciqComplianceHoldReason: reason.slice(0, 64),
    },
  });
}

export { OaciqMandatoryFormVersion };

export type CreateBrokerageContractInput = {
  listingId: string;
  brokerId: string;
  agencyId: string | null;
  contractType: BrokerageContractType;
  status?: BrokerageContractStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  includesDistributionAuthorization?: boolean;
  distributionScope?: Prisma.InputJsonValue | null;
  formVersion: OaciqMandatoryFormVersion;
};

export async function upsertBrokerageContract(input: CreateBrokerageContractInput): Promise<{ id: string }> {
  if (input.formVersion !== OaciqMandatoryFormVersion.REFORM_2022_MANDATORY) {
    throw new Error("INVALID_FORM_VERSION");
  }
  const row = await prisma.lecipmBrokerageContract.upsert({
    where: { listingId: input.listingId },
    create: {
      listingId: input.listingId,
      brokerId: input.brokerId,
      agencyId: input.agencyId,
      contractType: input.contractType,
      status: input.status ?? "draft",
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      includesDistributionAuthorization: input.includesDistributionAuthorization ?? false,
      distributionScope: input.distributionScope ?? undefined,
      formVersion: input.formVersion,
    },
    update: {
      brokerId: input.brokerId,
      agencyId: input.agencyId,
      contractType: input.contractType,
      status: input.status ?? undefined,
      startDate: input.startDate ?? undefined,
      endDate: input.endDate ?? undefined,
      includesDistributionAuthorization: input.includesDistributionAuthorization,
      distributionScope: input.distributionScope ?? undefined,
      formVersion: input.formVersion,
    },
    select: { id: true },
  });
  return row;
}
