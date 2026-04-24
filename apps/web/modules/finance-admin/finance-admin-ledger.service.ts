import type { Prisma } from "@prisma/client";
import { prisma } from "@repo/db";
import { logFinanceAdminTagged } from "@/lib/server/launch-logger";
import type { CreateHubLedgerEntryInput } from "./finance-admin.types";

const HUB_ACCOUNT_SEED_IDS = [
  { id: "hub_acct_broker_bank", name: "Brokerage — operating (hub)", domain: "BROKERAGE" as const, type: "BANK" as const },
  { id: "hub_acct_platform_bank", name: "Platform — operating (hub)", domain: "PLATFORM" as const, type: "BANK" as const },
  {
    id: "hub_acct_invest_bank",
    name: "Investment — SPV cash (hub sim)",
    domain: "INVESTMENT" as const,
    type: "ESCROW_SIMULATION" as const,
  },
];

export async function ensureHubFinanceAccounts(): Promise<void> {
  for (const row of HUB_ACCOUNT_SEED_IDS) {
    await prisma.complianceFinanceAccount.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        name: row.name,
        domain: row.domain,
        type: row.type,
        currency: "CAD",
      },
      update: {},
    });
  }
}

function toDecimal(s: string): Prisma.Decimal {
  return new Prisma.Decimal(s);
}

export async function createHubLedgerEntry(input: CreateHubLedgerEntryInput) {
  const account = await prisma.complianceFinanceAccount.findUnique({
    where: { id: input.accountId },
    select: { id: true, domain: true },
  });
  if (!account) throw new Error("Unknown compliance finance account.");
  if (account.domain !== input.domain) {
    throw new Error("Ledger domain must match the selected account domain (brokerage / platform / investment separation).");
  }

  const row = await prisma.complianceFinanceLedgerEntry.create({
    data: {
      accountId: input.accountId,
      domain: input.domain,
      entryType: input.entryType,
      referenceType: input.referenceType.slice(0, 64),
      referenceId: input.referenceId?.slice(0, 64) ?? null,
      amount: toDecimal(input.amount),
      taxExclusiveAmount: input.taxExclusiveAmount != null ? toDecimal(input.taxExclusiveAmount) : null,
      gstAmount: input.gstAmount != null ? toDecimal(input.gstAmount) : null,
      qstAmount: input.qstAmount != null ? toDecimal(input.qstAmount) : null,
      effectiveDate: input.effectiveDate,
      counterpartyId: input.counterpartyId ?? null,
      notesJson: input.notes ?? undefined,
    },
  });

  logFinanceAdminTagged.info("ledger_entry_created", {
    entryId: row.id,
    domain: input.domain,
    entryType: input.entryType,
    referenceType: input.referenceType,
  });

  return row;
}

export async function listRecentHubLedgerEntries(take = 100) {
  return prisma.complianceFinanceLedgerEntry.findMany({
    orderBy: { effectiveDate: "desc" },
    take,
    include: { account: { select: { name: true, domain: true, type: true } } },
  });
}
