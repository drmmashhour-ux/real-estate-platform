import { FIELD_SEED_LEADS } from "./field-constants";
import type { FieldLead, FieldStore, VisitLog } from "./field-types";

const STORAGE_VERSION = 1;

function storageKey(agentUserId: string): string {
  return `lecipm-field-team:v${STORAGE_VERSION}:${agentUserId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function loadFieldStore(agentUserId: string): FieldStore {
  if (typeof window === "undefined") return { leads: [], logs: [] };
  try {
    const raw = localStorage.getItem(storageKey(agentUserId));
    if (!raw) {
      const seeded: FieldLead[] = FIELD_SEED_LEADS.map((l) => ({
        ...l,
        updatedAt: nowIso(),
      }));
      const initial: FieldStore = { leads: seeded, logs: [] };
      localStorage.setItem(storageKey(agentUserId), JSON.stringify(initial));
      return initial;
    }
    const p = JSON.parse(raw) as FieldStore;
    if (!p.leads || !Array.isArray(p.leads)) p.leads = [];
    if (!p.logs || !Array.isArray(p.logs)) p.logs = [];
    return p;
  } catch {
    return { leads: [], logs: [] };
  }
}

export function saveFieldStore(agentUserId: string, store: FieldStore): void {
  try {
    localStorage.setItem(storageKey(agentUserId), JSON.stringify(store));
  } catch {
    /* quota */
  }
}

export function upsertLead(agentUserId: string, store: FieldStore, lead: FieldLead): FieldStore {
  const idx = store.leads.findIndex((l) => l.id === lead.id);
  const next = { ...store, leads: [...store.leads] };
  if (idx >= 0) next.leads[idx] = lead;
  else next.leads.push(lead);
  saveFieldStore(agentUserId, next);
  return next;
}

export function appendLog(
  agentUserId: string,
  store: FieldStore,
  log: VisitLog,
  leadStatusUpdate?: { leadId: string; status: FieldLead["status"] },
): FieldStore {
  const logs = [log, ...store.logs];
  let leads = store.leads.map((l) => ({ ...l }));
  if (leadStatusUpdate) {
    const i = leads.findIndex((l) => l.id === leadStatusUpdate.leadId);
    if (i >= 0) {
      leads[i] = {
        ...leads[i],
        status: leadStatusUpdate.status,
        updatedAt: nowIso(),
      };
    }
  }
  const next = { leads, logs };
  saveFieldStore(agentUserId, next);
  return next;
}

export function deleteLead(agentUserId: string, store: FieldStore, leadId: string): FieldStore {
  const next = {
    leads: store.leads.filter((l) => l.id !== leadId),
    logs: store.logs.filter((l) => l.leadId !== leadId),
  };
  saveFieldStore(agentUserId, next);
  return next;
}

export function newLeadId(): string {
  return `lead-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function newLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
