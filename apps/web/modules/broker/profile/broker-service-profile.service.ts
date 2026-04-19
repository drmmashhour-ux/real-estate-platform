/**
 * Explicit CRUD for broker service profiles — JSON row on `BrokerServiceProfile`.
 */

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type {
  BrokerCapacityProfile,
  BrokerLanguageProfile,
  BrokerLeadPreference,
  BrokerServiceArea,
  BrokerServiceProfile,
  BrokerServiceProfileStored,
  BrokerSpecialization,
} from "./broker-profile.types";
import { buildProfileConfidenceAndMergeNotes } from "./broker-profile-confidence.service";
import {
  emptyStoredProfile,
  parseBrokerServiceProfileStored,
  serializeStoredProfile,
} from "./broker-profile-payload";
import {
  recordBrokerServiceProfileUpdated,
  recordBrokerServiceProfileUpsert,
} from "./broker-service-profile-monitoring.service";

async function loadUserBroker(brokerId: string) {
  return prisma.user.findUnique({
    where: { id: brokerId },
    select: { id: true, role: true, name: true, email: true },
  });
}

export async function getBrokerServiceProfile(brokerId: string): Promise<BrokerServiceProfile | null> {
  const user = await loadUserBroker(brokerId);
  if (!user || user.role !== "BROKER") return null;

  const row = await prisma.brokerServiceProfile.findUnique({ where: { brokerId } });
  const stored = parseBrokerServiceProfileStored(row?.payload ?? null);
  const displayName = (user.name?.trim() || user.email?.trim() || "Broker").slice(0, 160);
  const { profileConfidence } = buildProfileConfidenceAndMergeNotes(stored);

  return {
    brokerId,
    displayName,
    ...stored,
    profileConfidence,
    updatedAt: row?.updatedAt.toISOString() ?? new Date(0).toISOString(),
  };
}

export async function listBrokerServiceProfiles(options?: { take?: number }): Promise<BrokerServiceProfile[]> {
  const take = Math.min(options?.take ?? 80, 200);
  const rows = await prisma.brokerServiceProfile.findMany({
    take,
    orderBy: { updatedAt: "desc" },
    include: {
      broker: { select: { id: true, role: true, name: true, email: true } },
    },
  });
  const out: BrokerServiceProfile[] = [];
  for (const row of rows) {
    if (row.broker.role !== "BROKER") continue;
    const stored = parseBrokerServiceProfileStored(row.payload);
    const displayName = (row.broker.name?.trim() || row.broker.email?.trim() || "Broker").slice(0, 160);
    const { profileConfidence } = buildProfileConfidenceAndMergeNotes(stored);
    out.push({
      brokerId: row.brokerId,
      displayName,
      ...stored,
      profileConfidence,
      updatedAt: row.updatedAt.toISOString(),
    });
  }
  return out;
}

export async function upsertBrokerServiceProfile(
  brokerId: string,
  stored: BrokerServiceProfileStored,
): Promise<BrokerServiceProfile | null> {
  const user = await loadUserBroker(brokerId);
  if (!user || user.role !== "BROKER") return null;

  const normalized = parseBrokerServiceProfileStored(serializeStoredProfile(stored));
  const payload = serializeStoredProfile(normalized) as Prisma.InputJsonValue;

  await prisma.brokerServiceProfile.upsert({
    where: { brokerId },
    create: { brokerId, payload },
    update: { payload },
  });

  try {
    recordBrokerServiceProfileUpsert(brokerId);
  } catch {
    /* noop */
  }

  return getBrokerServiceProfile(brokerId);
}

export async function updateBrokerServiceAreas(brokerId: string, serviceAreas: BrokerServiceArea[]) {
  const cur = await prisma.brokerServiceProfile.findUnique({ where: { brokerId } });
  const base = parseBrokerServiceProfileStored(cur?.payload ?? null);
  return upsertBrokerServiceProfile(brokerId, { ...base, serviceAreas });
}

export async function updateBrokerSpecializations(brokerId: string, specializations: BrokerSpecialization[]) {
  const cur = await prisma.brokerServiceProfile.findUnique({ where: { brokerId } });
  const base = parseBrokerServiceProfileStored(cur?.payload ?? null);
  return upsertBrokerServiceProfile(brokerId, { ...base, specializations });
}

export async function updateBrokerLeadPreferences(brokerId: string, leadPreferences: BrokerLeadPreference[]) {
  const cur = await prisma.brokerServiceProfile.findUnique({ where: { brokerId } });
  const base = parseBrokerServiceProfileStored(cur?.payload ?? null);
  return upsertBrokerServiceProfile(brokerId, { ...base, leadPreferences });
}

export async function updateBrokerLanguages(brokerId: string, languages: BrokerLanguageProfile[]) {
  const cur = await prisma.brokerServiceProfile.findUnique({ where: { brokerId } });
  const base = parseBrokerServiceProfileStored(cur?.payload ?? null);
  return upsertBrokerServiceProfile(brokerId, { ...base, languages });
}

export async function updateBrokerCapacity(brokerId: string, capacity: BrokerCapacityProfile) {
  const cur = await prisma.brokerServiceProfile.findUnique({ where: { brokerId } });
  const base = parseBrokerServiceProfileStored(cur?.payload ?? null);
  return upsertBrokerServiceProfile(brokerId, { ...base, capacity });
}

/** Initialize empty row so broker can PATCH incrementally. */
export async function getDeclaredStoredProfilesByBrokerIds(
  brokerIds: string[],
): Promise<Map<string, BrokerServiceProfileStored>> {
  const m = new Map<string, BrokerServiceProfileStored>();
  for (const id of brokerIds) m.set(id, emptyStoredProfile());
  if (brokerIds.length === 0) return m;
  const rows = await prisma.brokerServiceProfile.findMany({
    where: { brokerId: { in: brokerIds } },
    select: { brokerId: true, payload: true },
  });
  for (const r of rows) {
    m.set(r.brokerId, parseBrokerServiceProfileStored(r.payload));
  }
  return m;
}

export async function ensureBrokerServiceProfileRow(brokerId: string): Promise<void> {
  const user = await loadUserBroker(brokerId);
  if (!user || user.role !== "BROKER") return;
  const empty = emptyStoredProfile();
  await prisma.brokerServiceProfile.upsert({
    where: { brokerId },
    create: { brokerId, payload: serializeStoredProfile(empty) as Prisma.InputJsonValue },
    update: {},
  });
  try {
    recordBrokerServiceProfileUpdated("ensure");
  } catch {
    /* noop */
  }
}
