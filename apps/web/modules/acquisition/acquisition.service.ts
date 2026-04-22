import { randomBytes } from "crypto";

import { prisma } from "@/lib/db";

import { syncRelationshipFromPipeline } from "./acquisition.constants";
import { countUnreadAcquisitionNotifications, notifyAcquisitionAdmins } from "./acquisition-notifications.service";
import { nextPipelineStage } from "./acquisition-pipeline";
import type {
  AcquisitionContactVm,
  AcquisitionDashboardVm,
  AcquisitionPipelineStage,
  AcquisitionRelationshipStatus,
  AcquisitionSource,
  AcquisitionContactType,
  AcquisitionNoteVm,
} from "./acquisition.types";
import { computeAcquisitionMetrics } from "./acquisition-tracking.service";
import { computeOnboardingProgress } from "./onboarding.service";

function newNoteId(): string {
  return randomBytes(8).toString("hex");
}

function parseNotes(raw: unknown): AcquisitionNoteVm[] {
  if (!Array.isArray(raw)) return [];
  const out: AcquisitionNoteVm[] = [];
  for (const n of raw) {
    if (!n || typeof n !== "object") continue;
    const o = n as Record<string, unknown>;
    if (typeof o.body !== "string") continue;
    out.push({
      id: typeof o.id === "string" ? o.id : newNoteId(),
      at: typeof o.at === "string" ? o.at : new Date().toISOString(),
      body: o.body.slice(0, 8000),
      adminUserId: typeof o.adminUserId === "string" ? o.adminUserId : null,
    });
  }
  return out;
}

export function rowToVm(r: {
  id: string;
  type: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  relationshipStatus: string;
  pipelineStage: string;
  notesJson: unknown;
  assignedAdminId: string | null;
  linkedUserId: string | null;
  leadsGenerated: number;
  revenueCents: number;
  firstContactedAt: Date | null;
  convertedAt: Date | null;
  timeToOnboardMs: number | null;
  createdAt: Date;
  updatedAt: Date;
}): AcquisitionContactVm {
  return {
    id: r.id,
    type: r.type as AcquisitionContactType,
    name: r.name,
    email: r.email,
    phone: r.phone,
    source: r.source as AcquisitionSource,
    relationshipStatus: r.relationshipStatus as AcquisitionRelationshipStatus,
    pipelineStage: r.pipelineStage as AcquisitionPipelineStage,
    notes: parseNotes(r.notesJson),
    assignedAdminId: r.assignedAdminId,
    linkedUserId: r.linkedUserId,
    leadsGenerated: r.leadsGenerated,
    revenueCents: r.revenueCents,
    firstContactedAt: r.firstContactedAt?.toISOString() ?? null,
    convertedAt: r.convertedAt?.toISOString() ?? null,
    timeToOnboardMs: r.timeToOnboardMs,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listAcquisitionContacts(): Promise<AcquisitionContactVm[]> {
  const rows = await prisma.lecipmAcquisitionContact.findMany({
    orderBy: { updatedAt: "desc" },
    take: 500,
  });
  return rows.map(rowToVm);
}

export async function createAcquisitionContact(input: {
  type: AcquisitionContactType;
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: AcquisitionSource;
  assignedAdminId?: string | null;
  pipelineStage?: AcquisitionPipelineStage;
}): Promise<AcquisitionContactVm> {
  const pipelineStage = input.pipelineStage ?? "NEW";
  const relationshipStatus = syncRelationshipFromPipeline(pipelineStage);

  const row = await prisma.lecipmAcquisitionContact.create({
    data: {
      type: input.type,
      name: input.name.slice(0, 512),
      email: input.email?.slice(0, 320) ?? undefined,
      phone: input.phone?.slice(0, 48) ?? undefined,
      source: input.source ?? "manual",
      relationshipStatus,
      pipelineStage,
      assignedAdminId: input.assignedAdminId ?? undefined,
      notesJson: [],
    },
  });

  await notifyAcquisitionAdmins("acquisition_contact_created", {
    contactId: row.id,
    name: row.name,
    type: row.type,
    pipelineStage: row.pipelineStage,
  });

  return rowToVm(row);
}

export async function moveAcquisitionToNextStage(contactId: string): Promise<AcquisitionContactVm | null> {
  const row = await prisma.lecipmAcquisitionContact.findUnique({ where: { id: contactId } });
  if (!row) return null;

  const current = row.pipelineStage as AcquisitionPipelineStage;
  const next = nextPipelineStage(current);
  if (!next) return rowToVm(row);

  const relationshipStatus = syncRelationshipFromPipeline(next as AcquisitionPipelineStage);

  if (next === "CONVERTED" && !row.convertedAt) {
    await notifyAcquisitionAdmins("acquisition_conversion", {
      contactId,
      name: row.name,
      pipelineStage: next,
    });
  }

  const convertedAt =
    next === "CONVERTED" && !row.convertedAt
      ? new Date()
      : undefined;
  const timeToOnboardMs =
    next === "CONVERTED" && !row.convertedAt ? Math.max(0, Date.now() - row.createdAt.getTime()) : undefined;

  const updated = await prisma.lecipmAcquisitionContact.update({
    where: { id: contactId },
    data: {
      pipelineStage: next,
      relationshipStatus,
      ...(!row.firstContactedAt && next !== "NEW" ? { firstContactedAt: new Date() } : {}),
      ...(convertedAt ? { convertedAt, timeToOnboardMs } : {}),
    },
  });

  return rowToVm(updated);
}

export async function addAcquisitionNote(
  contactId: string,
  body: string,
  adminUserId?: string | null,
): Promise<AcquisitionContactVm | null> {
  const row = await prisma.lecipmAcquisitionContact.findUnique({ where: { id: contactId } });
  if (!row) return null;

  const prev = parseNotes(row.notesJson);
  const note: AcquisitionNoteVm = {
    id: newNoteId(),
    at: new Date().toISOString(),
    body: body.trim().slice(0, 8000),
    adminUserId: adminUserId ?? null,
  };

  await prisma.lecipmAcquisitionContact.update({
    where: { id: contactId },
    data: {
      notesJson: [...prev, note] as object[],
    },
  });

  const again = await prisma.lecipmAcquisitionContact.findUnique({ where: { id: contactId } });
  return again ? rowToVm(again) : null;
}

export async function assignAcquisitionOwner(contactId: string, adminUserId: string | null): Promise<AcquisitionContactVm | null> {
  const updated = await prisma.lecipmAcquisitionContact.update({
    where: { id: contactId },
    data: { assignedAdminId: adminUserId ?? undefined },
  });
  return rowToVm(updated);
}

export async function setAcquisitionLost(contactId: string): Promise<AcquisitionContactVm | null> {
  try {
    const updated = await prisma.lecipmAcquisitionContact.update({
      where: { id: contactId },
      data: {
        pipelineStage: "LOST",
        relationshipStatus: "LOST",
      },
    });
    return rowToVm(updated);
  } catch {
    return null;
  }
}

export async function incrementContactLeadsGenerated(contactId: string, delta = 1): Promise<void> {
  await prisma.lecipmAcquisitionContact.update({
    where: { id: contactId },
    data: { leadsGenerated: { increment: delta } },
  });
}

export async function incrementContactRevenue(contactId: string, cents: number): Promise<void> {
  await prisma.lecipmAcquisitionContact.update({
    where: { id: contactId },
    data: { revenueCents: { increment: cents } },
  });
}

export async function getAcquisitionDashboardVm(): Promise<AcquisitionDashboardVm> {
  const contacts = await listAcquisitionContacts();
  const metrics = await computeAcquisitionMetrics();
  const unreadNotifications = await countUnreadAcquisitionNotifications();

  const pipeline: AcquisitionDashboardVm["pipeline"] = {
    NEW: [],
    CONTACTED: [],
    FOLLOW_UP: [],
    DEMO_SCHEDULED: [],
    CONVERTED: [],
    LOST: [],
  };

  for (const c of contacts) {
    pipeline[c.pipelineStage]?.push(c);
  }

  const onboardingSamples = [];
  const linkedIds = [...new Set(contacts.map((c) => c.linkedUserId).filter(Boolean))] as string[];
  for (const uid of linkedIds.slice(0, 12)) {
    onboardingSamples.push(await computeOnboardingProgress(uid));
  }

  return {
    pipeline,
    contacts,
    metrics,
    onboardingSamples,
    unreadNotifications,
  };
}
