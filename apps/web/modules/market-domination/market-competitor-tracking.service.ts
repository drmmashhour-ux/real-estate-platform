import type { CompetitorPressureView, CompetitorRecord, Territory } from "./market-domination.types";

const STORAGE_KEY = "lecipm-market-competitors-v1";

export type CompetitorStore = {
  competitors: Record<string, CompetitorRecord>;
};

function empty(): CompetitorStore {
  return { competitors: {} };
}

let memory: CompetitorStore = empty();

export function loadCompetitorStore(): CompetitorStore {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) memory = { ...empty(), ...JSON.parse(raw) } as CompetitorStore;
    } catch {
      /* ignore */
    }
  }
  return memory;
}

export function saveCompetitorStore(store: CompetitorStore): void {
  memory = store;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* quota */
    }
  }
}

export function resetCompetitorStoreForTests(): void {
  memory = empty();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `cmp-${Date.now()}`;
}

export function upsertCompetitor(rec: Omit<CompetitorRecord, "id"> & { id?: string }): CompetitorRecord {
  const store = loadCompetitorStore();
  const id = rec.id ?? uid();
  const row: CompetitorRecord = { ...rec, id };
  store.competitors[id] = row;
  saveCompetitorStore(store);
  return row;
}

export function listCompetitors(): CompetitorRecord[] {
  return Object.values(loadCompetitorStore().competitors);
}

export function competitorsForTerritory(territoryId: string): CompetitorRecord[] {
  return listCompetitors().filter((c) => c.territoryId === territoryId);
}

/** 0–10 pressure — higher means heavier incumbent presence */
export function competitorPressureScore(competitors: CompetitorRecord[]): number {
  if (!competitors.length) return 2;
  const avg = competitors.reduce((s, c) => s + c.perceivedStrength, 0) / competitors.length;
  return Math.min(10, avg + competitors.length * 0.4);
}

export function buildCompetitorPressureView(
  territory: Territory,
  competitors: CompetitorRecord[]
): CompetitorPressureView {
  const pressureScore = competitorPressureScore(competitors);
  const weaknessZones: string[] = [];
  const attackAngles: string[] = [];

  for (const c of competitors) {
    if (c.perceivedStrength <= 5 && c.category === "SHORT_TERM_RENTAL") {
      weaknessZones.push(`${c.name}: perceived strength moderate — BNHub brand + ops story can wedge`);
    }
    if (c.category === "LISTING_PLATFORM") {
      attackAngles.push("Differentiate on routed intent + broker collaboration vs portal cold leads");
    }
    if (c.category === "BROKER_CRM") {
      attackAngles.push("Win deals where CRM ends at workflow but not demand generation");
    }
  }

  if (competitors.length === 0) {
    attackAngles.push("Low logged competition — validate with manual market scans before over-investing");
  }

  if (territory.metrics.leadVolume > 90 && pressureScore < 6) {
    weaknessZones.push("Demand exists with moderate logged competitor pressure — speed matters");
  }

  return {
    territoryId: territory.id,
    pressureScore,
    attackAngles: attackAngles.slice(0, 5),
    weaknessZones: weaknessZones.slice(0, 5),
  };
}
