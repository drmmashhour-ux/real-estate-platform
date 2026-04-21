import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { extractPreferencesFromTexts } from "@/modules/crm-memory/preference.extractor";
import { buildClientProfile, type ClientProfileCard } from "@/modules/crm-memory/client-profile.builder";

const TAG_MEM = "[crm-memory]";
const TAG_INS = "[client-insights]";

export async function loadClientMemoryRow(clientId: string, brokerId: string) {
  return prisma.clientMemory.findUnique({
    where: { clientId_brokerId: { clientId, brokerId } },
  });
}

export async function upsertClientMemoryNotes(params: {
  clientId: string;
  brokerId: string;
  notes?: string;
  preferences?: Record<string, unknown>;
}) {
  const row = await prisma.clientMemory.upsert({
    where: { clientId_brokerId: { clientId: params.clientId, brokerId: params.brokerId } },
    create: {
      clientId: params.clientId,
      brokerId: params.brokerId,
      notes: params.notes ?? "",
      preferences: (params.preferences ?? {}) as object,
    },
    update: {
      ...(params.notes !== undefined ? { notes: params.notes } : {}),
      ...(params.preferences !== undefined ? { preferences: params.preferences as object } : {}),
    },
  });
  logInfo(`${TAG_MEM} upsert`, { clientId: params.clientId });
  return row;
}

/** Merge transcript extraction into JSON preferences (does not overwrite non-empty stored strings). */
export async function mergeExtractedPreferences(params: {
  clientId: string;
  brokerId: string;
  messageTexts: string[];
}) {
  const extracted = extractPreferencesFromTexts(params.messageTexts);
  const existing = await loadClientMemoryRow(params.clientId, params.brokerId);
  const cur =
    existing?.preferences && typeof existing.preferences === "object"
      ? (existing.preferences as Record<string, unknown>)
      : {};

  const next = { ...cur };
  if (extracted.budgetLabel && typeof next.budget !== "string") next.budget = extracted.budgetLabel;
  if (extracted.preferredArea && typeof next.preferredArea !== "string")
    next.preferredArea = extracted.preferredArea;
  if (extracted.propertyType && typeof next.propertyType !== "string")
    next.propertyType = extracted.propertyType;

  const row = await prisma.clientMemory.upsert({
    where: { clientId_brokerId: { clientId: params.clientId, brokerId: params.brokerId } },
    create: {
      clientId: params.clientId,
      brokerId: params.brokerId,
      preferences: next as object,
      notes: "",
    },
    update: { preferences: next as object },
  });
  logInfo(`${TAG_INS} merged`, { clientId: params.clientId });
  return row;
}

export async function buildMemorySnapshot(params: {
  clientId: string;
  brokerId: string;
  messageTexts: string[];
}): Promise<{ profile: ClientProfileCard; notes: string }> {
  const extracted = extractPreferencesFromTexts(params.messageTexts);
  const row = await loadClientMemoryRow(params.clientId, params.brokerId);
  const prefs =
    row?.preferences && typeof row.preferences === "object"
      ? (row.preferences as Record<string, unknown>)
      : {};
  const profile = buildClientProfile(extracted, prefs);
  logInfo(`${TAG_INS} snapshot`, { hasRow: Boolean(row) });
  return { profile, notes: row?.notes ?? "" };
}
