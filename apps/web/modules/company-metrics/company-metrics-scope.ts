import type { Prisma } from "@prisma/client";
import type { ExecutiveScope } from "../owner-access/owner-access.types";

/** Residential sale pipeline deals (excludes commercial execution types). */
export const RESIDENTIAL_DEAL: Prisma.DealWhereInput = {
  OR: [
    { dealExecutionType: { in: ["residential_sale", "divided_coownership_sale", "undivided_coownership_sale"] } },
    { dealExecutionType: null },
  ],
};

export function dealWhereForExecutiveScope(scope: ExecutiveScope): Prisma.DealWhereInput {
  if (scope.kind === "platform") {
    return RESIDENTIAL_DEAL;
  }
  return {
    AND: [
      RESIDENTIAL_DEAL,
      {
        OR: [{ brokerageOfficeId: { in: scope.officeIds } }, { brokerId: { in: scope.brokerUserIds } }],
      },
    ],
  };
}

export function leadWhereForExecutiveScope(scope: ExecutiveScope): Prisma.LeadWhereInput {
  const nonMortgage: Prisma.LeadWhereInput = {
    OR: [{ leadType: null }, { leadType: { not: "mortgage" } }],
  };
  if (scope.kind === "platform") {
    return { AND: [nonMortgage, { introducedByBrokerId: { not: null } }] };
  }
  return { AND: [nonMortgage, { introducedByBrokerId: { in: scope.brokerUserIds } }] };
}

export function fsboListingWhereForExecutiveScope(scope: ExecutiveScope): Prisma.FsboListingWhereInput {
  const residential: Prisma.FsboListingWhereInput = {
    listingDealType: "SALE",
  };
  if (scope.kind === "platform") {
    return residential;
  }
  return {
    AND: [residential, { listingOwnerType: "BROKER", ownerId: { in: scope.brokerUserIds } }],
  };
}

export function commissionCaseWhereForExecutiveScope(scope: ExecutiveScope): Prisma.BrokerageCommissionCaseWhereInput {
  if (scope.kind === "platform") {
    return { transactionType: "residential_sale" };
  }
  return {
    transactionType: "residential_sale",
    officeId: { in: scope.officeIds },
  };
}

export function officeInvoiceWhereForExecutiveScope(scope: ExecutiveScope): Prisma.OfficeInvoiceWhereInput | null {
  if (scope.kind === "platform") {
    return {};
  }
  return { officeId: { in: scope.officeIds } };
}

export function officePayoutWhereForExecutiveScope(scope: ExecutiveScope): Prisma.OfficePayoutWhereInput | null {
  if (scope.kind === "platform") {
    return {};
  }
  return { officeId: { in: scope.officeIds } };
}
