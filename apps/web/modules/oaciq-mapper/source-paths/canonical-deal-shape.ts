import type { Deal, DealParty, User } from "@prisma/client";

/** Normalized internal deal object consumed by OACIQ mappers (specimen / draft assistance). */
export type PartyRow = {
  fullName: string;
  address?: string;
  phone?: string;
  email?: string;
  role?: string;
};

export type CanonicalDealShape = {
  deal: {
    meta: {
      id: string;
      dealCode?: string | null;
      principalFormNumber?: string | null;
      workflow?: string | null;
    };
    parties: {
      buyers: PartyRow[];
      sellers: PartyRow[];
    };
    broker: {
      licenseNumber?: string | null;
      agencyName?: string | null;
      email?: string | null;
      businessDetails?: string | null;
      representativeRelationship?: string | null;
    };
    immovable: {
      addressLine?: string;
      city?: string;
      postalCode?: string;
      fullAddress?: string;
      cadastralDescription?: string;
      lotSize?: string;
      buildingArea?: string;
      parking?: string;
      storage?: string;
    };
    price: {
      purchasePrice?: number;
      gstApplicable?: boolean;
      qstApplicable?: boolean;
      additionalSum?: number;
      balance?: number;
    };
    deposit: {
      amount?: number;
      timing?: string;
      method?: string;
      trusteeName?: string;
    };
    financing: {
      newLoanAmount?: number;
      existingLoanBalance?: number;
      maxRate?: string;
      amortizationYears?: number | string;
      term?: string;
      exclusiveMortgageBrokerage?: boolean;
    };
    dates: {
      deedOfSale?: string;
      occupancy?: string;
      acceptanceDeadline?: string;
      irrevocabilityDeadline?: string;
      lenderUndertakingDeadline?: string;
    };
    disclosures: Record<string, unknown>;
    conditions: Record<string, unknown>;
    documents: {
      annexRefs?: string;
      ppFormNumber?: string;
    };
    coownership: Record<string, unknown>;
    loanInfo: Record<string, unknown>;
    identityVerification: Record<string, unknown>;
    supportingDocs: Record<string, unknown>;
    counterProposal: Record<string, unknown>;
  };
};

function partyFromUser(u: Pick<User, "name" | "email" | "phone" | "sellerProfileAddress">): PartyRow {
  return {
    fullName: u.name?.trim() || "",
    email: u.email ?? undefined,
    phone: u.phone ?? undefined,
    address: u.sellerProfileAddress ?? undefined,
  };
}

function partyFromDealParty(p: DealParty): PartyRow {
  return {
    fullName: p.fullName,
    email: p.email ?? undefined,
    phone: p.phone ?? undefined,
    address: p.address ?? undefined,
    role: p.role,
  };
}

function deepMerge<T extends Record<string, unknown>>(base: T, overlay: Partial<T>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const k of Object.keys(overlay)) {
    const v = (overlay as Record<string, unknown>)[k];
    const b = out[k];
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      b &&
      typeof b === "object" &&
      !Array.isArray(b)
    ) {
      out[k] = deepMerge(b as Record<string, unknown>, v as Record<string, unknown>);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

export function buildCanonicalDealShape(
  deal: Deal & {
    buyer?: Pick<User, "name" | "email" | "phone" | "sellerProfileAddress">;
    seller?: Pick<User, "name" | "email" | "phone" | "sellerProfileAddress">;
    broker?: Pick<User, "name" | "email" | "phone"> | null;
    dealParties?: DealParty[];
  },
  overlay?: Partial<CanonicalDealShape["deal"]>,
): CanonicalDealShape {
  const meta = (deal.executionMetadata && typeof deal.executionMetadata === "object"
    ? deal.executionMetadata
    : {}) as Record<string, unknown>;
  const fromMeta = (meta.canonicalDeal && typeof meta.canonicalDeal === "object"
    ? meta.canonicalDeal
    : {}) as Partial<CanonicalDealShape["deal"]>;

  const buyers: PartyRow[] = [];
  const sellers: PartyRow[] = [];

  if (deal.buyer) buyers.push(partyFromUser(deal.buyer));
  if (deal.seller) sellers.push(partyFromUser(deal.seller));

  const primaryBuyerName = deal.buyer?.name?.trim();
  const primarySellerName = deal.seller?.name?.trim();
  for (const p of deal.dealParties ?? []) {
    if (p.role === "buyer" && p.fullName.trim() !== primaryBuyerName) buyers.push(partyFromDealParty(p));
    if (p.role === "seller" && p.fullName.trim() !== primarySellerName) sellers.push(partyFromDealParty(p));
  }

  const priceDollars = deal.priceCents / 100;

  const base: CanonicalDealShape["deal"] = {
    meta: {
      id: deal.id,
      dealCode: deal.dealCode,
      principalFormNumber: (meta.principalFormNumber as string) ?? deal.dealCode ?? null,
      workflow: deal.contractWorkflowState ?? null,
    },
    parties: { buyers, sellers },
    broker: {
      licenseNumber: (meta.brokerLicense as string) ?? null,
      agencyName: deal.broker?.name ?? (meta.agencyName as string) ?? null,
      email: deal.broker?.email ?? null,
      businessDetails: (meta.businessDetails as string) ?? undefined,
      representativeRelationship: (meta.representativeRelationship as string) ?? undefined,
    },
    immovable: {
      addressLine: (meta.addressLine as string) ?? deal.propertyReferenceId ?? deal.listingCode ?? "",
      city: (meta.city as string) ?? undefined,
      postalCode: (meta.postalCode as string) ?? undefined,
      fullAddress: [meta.addressLine, meta.city, meta.postalCode].filter(Boolean).join(", ") || undefined,
      cadastralDescription: (meta.cadastralDescription as string) ?? undefined,
      lotSize: (meta.lotSize as string) ?? undefined,
      buildingArea: (meta.buildingArea as string) ?? undefined,
      parking: (meta.parking as string) ?? undefined,
      storage: (meta.storage as string) ?? undefined,
    },
    price: {
      purchasePrice: priceDollars,
      gstApplicable: meta.gstApplicable as boolean | undefined,
      qstApplicable: meta.qstApplicable as boolean | undefined,
      additionalSum: meta.additionalSum as number | undefined,
      balance: meta.balance as number | undefined,
    },
    deposit: {
      amount:
        typeof meta.depositCents === "number" ? meta.depositCents / 100 : (meta.depositAmount as number | undefined),
      timing: meta.depositTiming as string | undefined,
      method: meta.depositMethod as string | undefined,
      trusteeName: meta.trusteeName as string | undefined,
    },
    financing: {
      newLoanAmount: meta.newLoanAmount as number | undefined,
      existingLoanBalance: meta.existingLoanBalance as number | undefined,
      maxRate: meta.maxRate as string | undefined,
      amortizationYears: meta.amortizationYears as number | undefined,
      term: meta.term as string | undefined,
      exclusiveMortgageBrokerage: meta.exclusiveMortgageBrokerage as boolean | undefined,
    },
    dates: {
      deedOfSale: meta.deedOfSale as string | undefined,
      occupancy: meta.occupancy as string | undefined,
      acceptanceDeadline: meta.acceptanceDeadline as string | undefined,
      irrevocabilityDeadline: meta.irrevocabilityDeadline as string | undefined,
      lenderUndertakingDeadline: meta.lenderUndertakingDeadline as string | undefined,
    },
    disclosures: (meta.disclosures as Record<string, unknown>) ?? {},
    conditions: (meta.conditions as Record<string, unknown>) ?? {},
    documents: {
      annexRefs: meta.annexRefs as string | undefined,
      ppFormNumber: (meta.ppFormNumber as string) ?? (meta.principalFormNumber as string) ?? undefined,
    },
    coownership: (meta.coownership as Record<string, unknown>) ?? {},
    loanInfo: (meta.loanInfo as Record<string, unknown>) ?? {},
    identityVerification: (meta.identityVerification as Record<string, unknown>) ?? {},
    supportingDocs: (meta.supportingDocs as Record<string, unknown>) ?? {},
    counterProposal: (meta.counterProposal as Record<string, unknown>) ?? {},
  };

  let merged: Record<string, unknown> = base as unknown as Record<string, unknown>;
  if (fromMeta && Object.keys(fromMeta).length > 0) {
    merged = deepMerge(merged, fromMeta as Record<string, unknown>);
  }
  if (overlay && Object.keys(overlay).length > 0) {
    merged = deepMerge(merged, overlay as Record<string, unknown>);
  }

  return { deal: merged as unknown as CanonicalDealShape["deal"] };
}
