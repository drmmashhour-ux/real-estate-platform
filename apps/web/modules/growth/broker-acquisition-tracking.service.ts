import { randomUUID } from "node:crypto";

import type {
  BrokerAcquisitionLead,
  BrokerAcquisitionLeadStatus,
  BrokerChannel,
} from "./broker-acquisition.types";

const store = new Map<string, BrokerAcquisitionLead>();

export function createBrokerLead(input: {
  name?: string;
  channel: BrokerChannel;
  notes?: string;
}): BrokerAcquisitionLead {
  const lead: BrokerAcquisitionLead = {
    id: randomUUID(),
    name: input.name,
    channel: input.channel,
    status: "not_contacted",
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };
  store.set(lead.id, lead);
  return lead;
}

export function updateBrokerStatus(
  id: string,
  status: BrokerAcquisitionLeadStatus,
  notes?: string,
): BrokerAcquisitionLead | null {
  const existing = store.get(id);
  if (!existing) return null;
  const next: BrokerAcquisitionLead = {
    ...existing,
    status,
    ...(notes !== undefined ? { notes } : {}),
  };
  store.set(id, next);
  return next;
}

export function listBrokerLeads(): BrokerAcquisitionLead[] {
  return [...store.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Test / dev reset only — not exposed in production UI. */
export function __resetBrokerAcquisitionStoreForTests(): void {
  store.clear();
}
