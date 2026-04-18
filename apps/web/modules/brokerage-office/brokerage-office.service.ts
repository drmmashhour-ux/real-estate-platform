import { prisma } from "@/lib/db";
import { brokerageOfficeAuditKeys, logBrokerageOfficeAudit } from "@/lib/brokerage/office-audit";
import type { OfficeSettingsPatch } from "./brokerage-office.types";
import { brokerageOfficeDisclaimer } from "./office-explainer";

export async function getOfficeWithSettings(officeId: string) {
  return prisma.brokerageOffice.findUnique({
    where: { id: officeId },
    include: {
      settings: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateOfficeSettings(
  officeId: string,
  actorUserId: string,
  patch: OfficeSettingsPatch,
) {
  const settings = await prisma.brokerageOfficeSettings.upsert({
    where: { officeId },
    create: {
      officeId,
      defaultCurrency: patch.defaultCurrency ?? "CAD",
      taxConfig: (patch.taxConfig ?? {}) as object,
      commissionConfig: (patch.commissionConfig ?? {}) as object,
      payoutConfig: (patch.payoutConfig ?? {}) as object,
      billingConfig: (patch.billingConfig ?? {}) as object,
      featureConfig: (patch.featureConfig ?? {}) as object,
    },
    update: {
      ...(patch.defaultCurrency ? { defaultCurrency: patch.defaultCurrency } : {}),
      ...(patch.taxConfig !== undefined ? { taxConfig: patch.taxConfig as object } : {}),
      ...(patch.commissionConfig !== undefined ? { commissionConfig: patch.commissionConfig as object } : {}),
      ...(patch.payoutConfig !== undefined ? { payoutConfig: patch.payoutConfig as object } : {}),
      ...(patch.billingConfig !== undefined ? { billingConfig: patch.billingConfig as object } : {}),
      ...(patch.featureConfig !== undefined ? { featureConfig: patch.featureConfig as object } : {}),
    },
  });

  await logBrokerageOfficeAudit({
    officeId,
    actorUserId,
    actionKey: brokerageOfficeAuditKeys.settingsUpdated,
    payload: { patch },
  });

  return { settings, disclaimer: brokerageOfficeDisclaimer() };
}

export async function createBrokerageOffice(input: {
  name: string;
  ownerUserId: string;
  legalName?: string;
  officeCode?: string;
  region?: string;
}) {
  const office = await prisma.brokerageOffice.create({
    data: {
      name: input.name,
      ownerUserId: input.ownerUserId,
      legalName: input.legalName,
      officeCode: input.officeCode,
      region: input.region,
      settings: {
        create: {},
      },
    },
    include: { settings: true },
  });

  await prisma.officeMembership.create({
    data: {
      officeId: office.id,
      userId: input.ownerUserId,
      membershipStatus: "active",
      role: "office_owner",
    },
  });

  const defaultPlan = await prisma.brokerageCommissionPlan.create({
    data: {
      officeId: office.id,
      name: "Default commission plan",
      status: "active",
      ruleConfig: {
        version: 1,
        officeSharePercent: 30,
        brokerShareOfRemainderPercent: 100,
        deductions: [],
      },
    },
  });

  await prisma.brokerCommissionAssignment.create({
    data: {
      officeId: office.id,
      brokerUserId: input.ownerUserId,
      commissionPlanId: defaultPlan.id,
      effectiveFrom: new Date(),
    },
  });

  await logBrokerageOfficeAudit({
    officeId: office.id,
    actorUserId: input.ownerUserId,
    actionKey: brokerageOfficeAuditKeys.memberAdded,
    payload: { role: "office_owner" },
  });

  return office;
}
