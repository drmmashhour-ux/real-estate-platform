import type {
  BehaviorSignals,
  LeadDashboardStats,
  LeadIntent,
  LeadLifecycle,
  LeadRecord,
  LeadSourceChannel,
} from "./leads.types";
import { routeLead } from "./leads-routing.service";
import { scoreLead } from "./leads-scoring.service";

const STORAGE_KEY = "lecipm-growth-leads-v1";

export type GrowthLeadsStore = {
  leads: Record<string, LeadRecord>;
};

function emptyStore(): GrowthLeadsStore {
  return { leads: {} };
}

let memory: GrowthLeadsStore = emptyStore();

export function loadGrowthLeadsStore(): GrowthLeadsStore {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) memory = { ...emptyStore(), ...JSON.parse(raw) } as GrowthLeadsStore;
    } catch {
      /* ignore */
    }
  }
  return memory;
}

export function saveGrowthLeadsStore(store: GrowthLeadsStore): void {
  memory = store;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* quota */
    }
  }
}

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `lead-${Date.now()}`;
}

export function resetGrowthLeadsStoreForTests(): void {
  memory = emptyStore();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

export type CaptureLeadInput = {
  intent: LeadIntent;
  source: LeadSourceChannel;
  name?: string;
  email?: string;
  phone?: string;
  sourceDetail?: string;
  behaviors?: BehaviorSignals;
  lifecycle?: LeadLifecycle;
};

export function captureLead(input: CaptureLeadInput): LeadRecord {
  const intentLevel = scoreLead({
    intent: input.intent,
    source: input.source,
    behaviors: input.behaviors,
  });

  const route = routeLead(
    { intent: input.intent, source: input.source },
    intentLevel,
    input.behaviors
  );

  const id = uid();
  const lead: LeadRecord = {
    id,
    name: input.name?.trim() || undefined,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    intent: input.intent,
    source: input.source,
    sourceDetail: input.sourceDetail,
    capturedAtIso: new Date().toISOString(),
    lifecycle: input.lifecycle ?? "NEW",
    intentLevel,
    route,
    behaviors: input.behaviors,
  };

  const store = loadGrowthLeadsStore();
  store.leads[id] = lead;
  saveGrowthLeadsStore(store);
  return lead;
}

export function listLeads(): LeadRecord[] {
  const store = loadGrowthLeadsStore();
  return Object.values(store.leads).sort((a, b) =>
    (b.capturedAtIso || "").localeCompare(a.capturedAtIso || "")
  );
}

export function getLead(id: string): LeadRecord | undefined {
  return loadGrowthLeadsStore().leads[id];
}

export function updateLeadLifecycle(id: string, lifecycle: LeadLifecycle): LeadRecord | null {
  const store = loadGrowthLeadsStore();
  const cur = store.leads[id];
  if (!cur) return null;
  store.leads[id] = { ...cur, lifecycle };
  saveGrowthLeadsStore(store);
  return store.leads[id]!;
}

export function buildLeadDashboardStats(leads: LeadRecord[]): LeadDashboardStats {
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.lifecycle === "NEW").length;

  const sourceBreakdown: LeadDashboardStats["sourceBreakdown"] = {};
  for (const l of leads) {
    sourceBreakdown[l.source] = (sourceBreakdown[l.source] ?? 0) + 1;
  }

  const terminal = leads.filter((l) => l.lifecycle === "CONVERTED" || l.lifecycle === "LOST");
  const converted = leads.filter((l) => l.lifecycle === "CONVERTED").length;
  const conversionRate =
    terminal.length > 0 ? converted / terminal.length : 0;

  const winRateVsAll = totalLeads > 0 ? converted / totalLeads : 0;

  return {
    totalLeads,
    newLeads,
    sourceBreakdown,
    conversionRate,
    winRateVsAll,
  };
}
