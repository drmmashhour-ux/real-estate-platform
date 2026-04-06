import {
  Prisma,
  type GrowthEngineLead,
  type GrowthEngineLeadRole,
  type GrowthEngineLeadSource,
  type GrowthEngineLeadStage,
  type GrowthEnginePermissionStatus,
  type ListingAcquisitionSourceType,
} from "@prisma/client";
import { prisma } from "@/lib/db";

export function acquisitionRoleToGrowthRole(st: ListingAcquisitionSourceType): GrowthEngineLeadRole {
  switch (st) {
    case "OWNER":
      return "owner";
    case "BROKER":
      return "broker";
    case "HOST":
      return "host";
    default:
      return "owner";
  }
}

export async function createGrowthLeadFromListingAcquisition(input: {
  listingAcquisitionLeadId: string;
  sourceType: ListingAcquisitionSourceType;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  city: string;
  propertyCategory: string;
}): Promise<void> {
  try {
    await prisma.growthEngineLead.create({
      data: {
        role: acquisitionRoleToGrowthRole(input.sourceType),
        name: input.contactName,
        email: input.contactEmail.toLowerCase(),
        phone: input.contactPhone ?? null,
        city: input.city,
        category: input.propertyCategory,
        intent: "list",
        source: "form",
        permissionStatus: "granted",
        stage: "awaiting_assets",
        listingAcquisitionLeadId: input.listingAcquisitionLeadId,
        consentAt: new Date(),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return;
    }
    throw e;
  }
}

export async function createGrowthLeadFromCapture(input: {
  email: string;
  phone?: string | null;
  fullName?: string | null;
  city?: string | null;
  category?: string | null;
  intentHost: boolean;
  /** buy | rent | list | host — optional refinement */
  intentDetail?: string | null;
  referralCode?: string | null;
  consentAt: Date | null;
  source?: string;
}): Promise<void> {
  const role = input.intentHost ? "host" : "buyer";
  const intent =
    input.intentDetail?.trim() ||
    (input.intentHost ? "list" : "buy");
  const permissionStatus = input.consentAt ? "granted" : "unknown";

  await prisma.growthEngineLead.create({
    data: {
      role,
      name: input.fullName?.trim() || null,
      email: input.email.toLowerCase(),
      phone: input.phone ?? null,
      city: input.city?.trim() || null,
      category: input.category?.trim() || null,
      source: "form",
      permissionStatus,
      stage: "new",
      intent,
      consentAt: input.consentAt,
      referralCode: input.referralCode?.trim().slice(0, 64) || null,
    },
  });
}

/** After admin converts acquisition → draft listing, align CRM stage. */
export async function markGrowthEngineLeadConvertedForAcquisition(listingAcquisitionLeadId: string): Promise<void> {
  await prisma.growthEngineLead.updateMany({
    where: { listingAcquisitionLeadId },
    data: {
      stage: "converted",
      needsFollowUp: false,
      followUpReason: null,
      lastContactAt: new Date(),
    },
  });
}

export async function bulkCreateFromCsv(
  rows: Array<{
    name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    type: GrowthEngineLeadRole;
  }>,
  permission: GrowthEnginePermissionStatus
): Promise<{ created: number }> {
  let created = 0;
  for (const r of rows) {
    await prisma.growthEngineLead.create({
      data: {
        role: r.type,
        name: r.name,
        email: r.email,
        phone: r.phone,
        city: r.city,
        source: "csv",
        permissionStatus: permission,
        stage: "new",
      },
    });
    created++;
  }
  return { created };
}

export async function quickAddManualLead(data: {
  role: GrowthEngineLeadRole;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  source: GrowthEngineLeadSource;
  permissionStatus: GrowthEnginePermissionStatus;
  notes?: string | null;
}): Promise<{ id: string }> {
  const row = await prisma.growthEngineLead.create({
    data: {
      role: data.role,
      name: data.name,
      email: data.email?.toLowerCase() ?? null,
      phone: data.phone ?? null,
      city: data.city ?? null,
      source: data.source,
      permissionStatus: data.permissionStatus,
      stage: "new",
      notes: data.notes ?? null,
    },
    select: { id: true },
  });
  return row;
}

export async function updateLeadStage(
  id: string,
  patch: Partial<{
    stage: GrowthEngineLeadStage;
    notes: string | null;
    lastContactAt: Date | null;
    lastTemplateKey: string | null;
    assignedToUserId: string | null;
    archivedAt: Date | null;
    needsFollowUp: boolean;
    followUpReason: string | null;
  }>
): Promise<void> {
  await prisma.growthEngineLead.update({
    where: { id },
    data: {
      ...patch,
      updatedAt: new Date(),
    },
  });
}

export type GrowthLeadListFilter = {
  stage?: GrowthEngineLeadStage;
  needsFollowUp?: boolean;
};

export async function listGrowthLeads(filter: GrowthLeadListFilter): Promise<GrowthEngineLead[]> {
  return prisma.growthEngineLead.findMany({
    where: {
      archivedAt: null,
      ...(filter.stage ? { stage: filter.stage } : {}),
      ...(filter.needsFollowUp != null ? { needsFollowUp: filter.needsFollowUp } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });
}
